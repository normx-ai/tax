// mobile/lib/api/chat.ts
// Client API chat IA fiscal - SSE streaming + CRUD conversations

import { api, isWeb, isMobile, API_URL } from "./client";

// --- Types ---

export interface ChatMessage {
  id: string;
  role: "USER" | "ASSISTANT" | "SYSTEM";
  content: string;
  citations?: Citation[];
  tokensUsed?: number;
  responseTime?: number;
  createdAt: string;
}

export interface Conversation {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { messages: number };
  messages?: ChatMessage[];
}

export interface Citation {
  articleNumber: string;
  titre?: string;
  excerpt: string;
  score: number;
}

export interface StreamCallbacks {
  onConversation?: (conversationId: string) => void;
  onChunk?: (text: string) => void;
  onCitations?: (citations: Citation[]) => void;
  onDone?: (metadata: { messageId: string; tokensUsed: number; responseTime: number }) => void;
  onError?: (error: string) => void;
}

// --- Helpers pour lire le token (mobile uniquement) ---

async function getAuthToken(): Promise<string | null> {
  const { useAuthStore } = require("@/lib/store/auth");
  return useAuthStore.getState().getToken();
}

// --- SSE Streaming ---

/**
 * Envoyer un message avec streaming SSE
 * Utilise fetch natif pour lire le stream de reponse
 * Web : credentials include (cookies httpOnly)
 * Mobile : Authorization Bearer token
 */
export async function sendMessageStream(
  content: string,
  conversationId?: string,
  callbacks?: StreamCallbacks
): Promise<void> {
  const SSE_TIMEOUT_MS = 2 * 60 * 1000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SSE_TIMEOUT_MS);

  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };

    if (isMobile) {
      headers["X-Platform"] = "mobile";
    }
    const token = await getAuthToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    let response = await fetch(`${API_URL}/chat/message/stream`, {
      method: "POST",
      headers,
      body: JSON.stringify({ content, conversationId }),
      credentials: isWeb ? "include" : "omit",
      signal: controller.signal,
    });

    // Si 401 : tenter un refresh token Keycloak puis réessayer
    if (response.status === 401 && isWeb) {
      try {
        const { useAuthStore } = require("@/lib/store/auth");
        const newToken = await useAuthStore.getState().getToken();
        if (newToken) {
          headers.Authorization = `Bearer ${newToken}`;
          response = await fetch(`${API_URL}/chat/message/stream`, {
            method: "POST",
            headers,
            body: JSON.stringify({ content, conversationId }),
            signal: controller.signal,
          });
        }
      } catch {
        // refresh échoué
      }
    }

    if (!response.ok) {
      const errorText = await response.text();
      let errorMsg = "Erreur serveur";
      try {
        const parsed = JSON.parse(errorText);
        errorMsg = parsed.error || errorMsg;
      } catch {
        // ignore parse error
      }
      callbacks?.onError?.(errorMsg);
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      callbacks?.onError?.("Streaming non supporte");
      return;
    }

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      let currentEvent = "";
      let currentData = "";
      for (const line of lines) {
        if (line.startsWith("event: ")) {
          currentEvent = line.slice(7).trim();
          currentData = "";
        } else if (line.startsWith("data: ")) {
          currentData += (currentData ? "\n" : "") + line.slice(6);
        } else if (line === "" && currentEvent && currentData) {
          try {
            const data = JSON.parse(currentData);

            switch (currentEvent) {
              case "conversation":
                callbacks?.onConversation?.(data.conversationId);
                break;
              case "chunk":
                callbacks?.onChunk?.(data.text);
                break;
              case "citations":
                callbacks?.onCitations?.(data.citations);
                break;
              case "done":
                callbacks?.onDone?.(data);
                break;
              case "error":
                callbacks?.onError?.(data.error);
                break;
            }
          } catch {
            // ignore parse errors on incomplete data
          }
          currentEvent = "";
          currentData = "";
        }
      }
    }
  } finally {
    clearTimeout(timeoutId);
  }
}

// --- CRUD Conversations (via axios) ---

/**
 * Lister les conversations de l'utilisateur
 */
export async function getConversations(): Promise<Conversation[]> {
  const { data } = await api.get<{ conversations: Conversation[] }>("/chat/conversations");
  return data.conversations;
}

/**
 * Recuperer une conversation avec ses messages
 */
export async function getConversation(id: string): Promise<Conversation & { messages: ChatMessage[] }> {
  const { data } = await api.get<{ conversation: Conversation & { messages: ChatMessage[] } }>(
    `/chat/conversations/${id}`
  );
  return data.conversation;
}

/**
 * Supprimer une conversation
 */
export async function deleteConversation(id: string): Promise<void> {
  await api.delete(`/chat/conversations/${id}`);
}

/**
 * Récupérer les références croisées d'un article
 */
export interface ArticleReference {
  id: string;
  numero: string;
  titre: string;
}

export interface ArticleReferencesResponse {
  article: ArticleReference;
  references: ArticleReference[];
  referencedBy: ArticleReference[];
}

export async function getArticleReferences(numero: string): Promise<ArticleReferencesResponse> {
  const { data } = await api.get<ArticleReferencesResponse>(`/chat/article/${encodeURIComponent(numero)}/references`);
  return data;
}
