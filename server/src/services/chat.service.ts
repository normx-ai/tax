// server/src/services/chat.service.ts
// Service chat IA fiscal - RAG hybride + Claude API + schema PostgreSQL isolation

import Anthropic, { APIError } from "@anthropic-ai/sdk";
import { buildSimplePrompt, buildFiscalPrompt, buildContextPrompt, buildSocialContextPrompt, buildSocialFallbackPrompt, buildStrictNoResultPrompt } from "./chat.prompts";
import { hybridSearch, isSocialQuery, SearchResult } from "./rag/hybrid-search.service";
import { isFiscalQuery, buildContext, extractArticlesFromResponse, Citation } from "./rag/chat.utils";
import { createLogger } from "../utils/logger";
import { orchestrate } from "./orchestrator";
import * as chatDb from "../db/chat.db";
import * as analyticsDb from "../db/analytics.db";

const logger = createLogger('ChatService');
const anthropic = new Anthropic();

const CLAUDE_MODEL = "claude-sonnet-4-20250514";
const MAX_TOKENS = 2000;
const MAX_HISTORY_MESSAGES = 20;
const MAX_HISTORY_CHARS = 24000;

const GREETING_PATTERNS = [
  /^(bonjour|bonsoir|salut|hello|hi|hey|coucou|yo)\b/i,
  /^(merci|thanks|thank you)\b/i,
  /^(au revoir|bye|a bientot|a\+)\b/i,
  /^(comment vas-tu|ca va|comment tu vas)\b/i,
  /^(qui es-tu|tu es qui|c est quoi cgi)\b/i,
];

function trimHistory(messages: { role: string; content: string }[]): { role: string; content: string }[] {
  const trimmed: { role: string; content: string }[] = [];
  let totalChars = 0;
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (totalChars + msg.content.length > MAX_HISTORY_CHARS) break;
    trimmed.unshift(msg);
    totalChars += msg.content.length;
  }
  return trimmed;
}

/**
 * Extrait le type interieur d'une erreur Anthropic SDK.
 * Le SDK Anthropic stocke le body JSON (ex: {"type":"error","error":{"type":"overloaded_error"}})
 * a plusieurs endroits selon les versions :
 * - err.status : le code HTTP
 * - err.error : objet parsé (parfois absent)
 * - err.message : JSON string (fallback — le SDK y met souvent le body brut)
 */
function getAnthropicErrorType(err: unknown): { status?: number; innerType?: string } {
  if (!err || typeof err !== 'object') return {};
  const e = err as { status?: number; error?: unknown; message?: string };
  const result: { status?: number; innerType?: string } = {};
  if (typeof e.status === 'number') result.status = e.status;

  // Tentative 1 : err.error structure
  const body = e.error as { type?: string; error?: { type?: string } } | undefined;
  if (body && typeof body === 'object') {
    if (body.error && typeof body.error === 'object' && body.error.type) {
      result.innerType = body.error.type;
    } else if (body.type && body.type !== 'error') {
      result.innerType = body.type;
    }
  }

  // Tentative 2 : parser err.message comme JSON (cas le plus frequent avec APIError)
  if (!result.innerType && typeof e.message === 'string') {
    const jsonStart = e.message.indexOf('{');
    if (jsonStart >= 0) {
      try {
        const parsed = JSON.parse(e.message.slice(jsonStart)) as { type?: string; error?: { type?: string } };
        if (parsed.error && typeof parsed.error === 'object' && parsed.error.type) {
          result.innerType = parsed.error.type;
        } else if (parsed.type && parsed.type !== 'error') {
          result.innerType = parsed.type;
        }
      } catch {
        // pas un JSON, on ignore
      }
    }
  }

  // Tentative 3 : heuristique sur le texte du message (dernier filet)
  if (!result.innerType && typeof e.message === 'string') {
    if (/overloaded/i.test(e.message)) result.innerType = 'overloaded_error';
    else if (/rate.?limit/i.test(e.message)) result.innerType = 'rate_limit_error';
  }

  return result;
}

/**
 * Transforme une erreur brute de l'API Anthropic en message utilisateur lisible.
 * Retourne null si l'erreur n'est pas reconnue comme une erreur Anthropic.
 */
function friendlyAnthropicError(err: unknown): string | null {
  const { status, innerType } = getAnthropicErrorType(err);

  if (status === 529 || innerType === 'overloaded_error') {
    return "Les serveurs de l'IA sont momentanement surcharges. Reessaie dans quelques secondes.";
  }
  if (status === 429 || innerType === 'rate_limit_error') {
    return "Limite de requetes atteinte. Patiente une minute puis reessaie.";
  }
  if (status === 401 || innerType === 'authentication_error') {
    return "Erreur d'authentification de l'IA. Contacte le support.";
  }
  if (status === 500 || status === 502 || status === 503 || innerType === 'api_error') {
    return "L'IA est momentanement indisponible. Reessaie dans quelques instants.";
  }
  // Fallback si on a reconnu une erreur Anthropic mais pas mappee
  if (err instanceof APIError) {
    return "Erreur de l'IA. Reessaie dans quelques instants.";
  }
  return null;
}

function isRetryable(err: unknown): boolean {
  const { status, innerType } = getAnthropicErrorType(err);
  return status === 529 || status === 503 || status === 502 ||
    innerType === 'overloaded_error' || innerType === 'api_error';
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isSimpleGreeting(query: string): boolean {
  return GREETING_PATTERNS.some((pattern) => pattern.test(query.trim()));
}

// Nombre max de chunks renvoyes au LLM. Avant: 8 (trop restrictif sur 11k+ documents,
// les articles courts comme 373 ter passaient sous le radar). Claude Sonnet a 200K
// tokens de contexte donc 25 chunks ~10K tokens reste tres confortable.
const RAG_TOP_K = 25;

async function performRAGSearch(content: string): Promise<SearchResult[] | null> {
  if (!isFiscalQuery(content)) return null;
  try {
    const results = await hybridSearch(content, RAG_TOP_K, '2026');
    if (results.length > 0) {
      const top = results[0];
      logger.info(`RAG: ${results.length} articles trouvés pour "${content.substring(0, 50)}..." (top: ${top.payload.numero}, score: ${top.score.toFixed(3)})`);
      return results;
    }
    return null;
  } catch (error) {
    logger.warn('RAG indisponible, fallback:', error);
    return null;
  }
}

function buildSystemPrompt(content: string, searchResults: SearchResult[] | null): string {
  const socialQuery = isSocialQuery(content);
  if (isSimpleGreeting(content)) return buildSimplePrompt();
  if (searchResults && searchResults.length > 0) {
    const context = buildContext(searchResults);
    const basePrompt = socialQuery ? buildSocialContextPrompt(context) : buildContextPrompt(context);
    const { enhancedSystemPrompt, agent } = orchestrate(content, basePrompt);
    logger.info(`Agent: ${agent.name} (social: ${socialQuery})`);
    return enhancedSystemPrompt;
  }
  // Pas de resultat RAG : prompt strict qui interdit l'invention de chiffres/articles
  // (utilise le fallback social pour les questions sociales, sinon refus stricte)
  if (socialQuery) {
    const { enhancedSystemPrompt } = orchestrate(content, buildSocialFallbackPrompt());
    return enhancedSystemPrompt;
  }
  logger.warn(`RAG vide pour "${content.substring(0, 60)}" — strict fallback`);
  return buildStrictNoResultPrompt();
}

/**
 * Envoyer un message — reponse complete (non-streaming)
 */
export async function sendMessage(
  schema: string,
  userId: string,
  content: string,
  conversationId?: string,
) {
  let conversation;
  if (conversationId) {
    conversation = await chatDb.findConversation(schema, conversationId, userId);
    if (!conversation) throw new Error("Conversation introuvable");
  } else {
    conversation = await chatDb.createConversation(schema, userId, content.slice(0, 80));
  }

  await chatDb.createMessage(schema, conversation.id, userId, "USER", content);

  const rawMessages = await chatDb.getMessages(schema, conversation.id, MAX_HISTORY_MESSAGES);
  const previousMessages = trimHistory(rawMessages);

  const searchResults = await performRAGSearch(content);
  const systemPrompt = buildSystemPrompt(content, searchResults);

  const startTime = Date.now();
  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: MAX_TOKENS,
    system: systemPrompt,
    messages: previousMessages.map((msg) => ({
      role: msg.role === "USER" ? "user" as const : "assistant" as const,
      content: msg.content,
    })),
  });

  const responseTime = Date.now() - startTime;
  const rawContent = response.content?.[0]?.type === "text" ? response.content[0].text : "";
  const assistantContent = rawContent.replace(/\*\*/g, "");
  const tokensUsed = (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);

  let citations: Citation[] | undefined;
  if (searchResults && searchResults.length > 0) {
    citations = extractArticlesFromResponse(assistantContent, searchResults);
  }

  const assistantMessage = await chatDb.createMessage(
    schema, conversation.id, userId, "ASSISTANT", assistantContent, citations
  );

  // Fire-and-forget
  chatDb.createSearchHistory(schema, userId, content, searchResults?.length || 0).catch((err) => { logger.warn('Failed to track search history', { error: err instanceof Error ? err.message : String(err) }); });
  analyticsDb.trackUsage(schema, userId, "chat_message", { tokensUsed }).catch((err) => { logger.warn('Failed to track usage', { error: err instanceof Error ? err.message : String(err) }); });

  return { conversationId: conversation.id, message: assistantMessage };
}

/**
 * Envoyer un message avec streaming SSE
 */
export async function* sendMessageStream(
  schema: string,
  userId: string,
  content: string,
  conversationId?: string,
): AsyncGenerator<{ event: string; data: string }> {
  let conversation;
  if (conversationId) {
    conversation = await chatDb.findConversation(schema, conversationId, userId);
    if (!conversation) throw new Error("Conversation introuvable");
  } else {
    conversation = await chatDb.createConversation(schema, userId, content.slice(0, 80));
  }

  yield { event: "conversation", data: JSON.stringify({ conversationId: conversation.id }) };

  await chatDb.createMessage(schema, conversation.id, userId, "USER", content);

  const rawMessages = await chatDb.getMessages(schema, conversation.id, MAX_HISTORY_MESSAGES);
  const previousMessages = trimHistory(rawMessages);

  const searchResults = await performRAGSearch(content);
  const systemPrompt = buildSystemPrompt(content, searchResults);

  const startTime = Date.now();
  let fullContent = "";
  let pendingBuffer = "";

  // Retire les ** (gras markdown) en streaming. Le ** peut etre coupe en deux
  // chunks ("*" puis "*"), on garde 1 char en buffer pour eviter de laisser
  // filer une moitie seule.
  const stripBold = (chunk: string): string => {
    const combined = pendingBuffer + chunk;
    // Remplace tous les ** par rien
    const stripped = combined.replace(/\*\*/g, "");
    // Si le dernier char est une etoile isolee, on la garde en buffer pour la
    // fusionner avec le prochain chunk (cas "*" + "*")
    if (stripped.endsWith("*")) {
      pendingBuffer = "*";
      return stripped.slice(0, -1);
    }
    pendingBuffer = "";
    return stripped;
  };

  const messagesForApi = previousMessages.map((msg) => ({
    role: msg.role === "USER" ? "user" as const : "assistant" as const,
    content: msg.content,
  }));

  // Retry avec backoff sur les erreurs transitoires d'Anthropic (overloaded, etc.)
  // Ne retry que si aucun chunk n'a encore ete envoye au client.
  const MAX_ATTEMPTS = 3;
  const BACKOFF_MS = [0, 1500, 3500]; // 0ms, 1.5s, 3.5s
  let stream: ReturnType<typeof anthropic.messages.stream> | null = null;
  let lastErr: unknown = null;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) await sleep(BACKOFF_MS[attempt]);
    try {
      stream = anthropic.messages.stream({
        model: CLAUDE_MODEL,
        max_tokens: MAX_TOKENS,
        system: systemPrompt,
        messages: messagesForApi,
      });
      // Consomme le stream ; si erreur avant tout chunk on peut retry
      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          const cleaned = stripBold(event.delta.text);
          fullContent += cleaned;
          if (cleaned) {
            yield { event: "chunk", data: JSON.stringify({ text: cleaned }) };
          }
        }
      }
      // Flush le buffer final au cas ou on termine sur une etoile orpheline
      if (pendingBuffer) {
        fullContent += pendingBuffer;
        yield { event: "chunk", data: JSON.stringify({ text: pendingBuffer }) };
        pendingBuffer = "";
      }
      lastErr = null;
      break;
    } catch (err) {
      lastErr = err;
      if (fullContent.length > 0 || !isRetryable(err)) {
        // Des chunks ont deja ete envoyes, ou erreur non-retryable : on abandonne
        break;
      }
      logger.warn(`Anthropic stream attempt ${attempt + 1}/${MAX_ATTEMPTS} failed, retrying`, {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  if (lastErr) {
    // Log l'erreur complete pour debug (shape Anthropic APIError vs generic)
    const detected = getAnthropicErrorType(lastErr);
    logger.error('Anthropic stream final error', {
      isAPIError: lastErr instanceof APIError,
      status: detected.status,
      innerType: detected.innerType,
      message: lastErr instanceof Error ? lastErr.message : String(lastErr),
    });
    const friendly = friendlyAnthropicError(lastErr) || "Erreur lors de la generation de la reponse. Reessaie.";
    throw new Error(friendly);
  }

  const finalMessage = await stream!.finalMessage();
  const responseTime = Date.now() - startTime;
  const tokensUsed = (finalMessage.usage?.input_tokens || 0) + (finalMessage.usage?.output_tokens || 0);

  let citations: Citation[] | undefined;
  if (searchResults && searchResults.length > 0) {
    citations = extractArticlesFromResponse(fullContent, searchResults);
    if (citations.length > 0) {
      yield { event: "citations", data: JSON.stringify({ citations }) };
    }
  }

  const assistantMessage = await chatDb.createMessage(
    schema, conversation.id, userId, "ASSISTANT", fullContent, citations
  );

  // Fire-and-forget
  chatDb.createSearchHistory(schema, userId, content, searchResults?.length || 0).catch((err) => { logger.warn('Failed to track search history', { error: err instanceof Error ? err.message : String(err) }); });
  analyticsDb.trackUsage(schema, userId, "chat_message", { tokensUsed }).catch((err) => { logger.warn('Failed to track usage', { error: err instanceof Error ? err.message : String(err) }); });

  yield {
    event: "done",
    data: JSON.stringify({ messageId: assistantMessage.id, tokensUsed, responseTime }),
  };
}

/**
 * Lister les conversations
 */
export async function getConversations(schema: string, userId: string) {
  return chatDb.listConversations(schema, userId);
}

/**
 * Recuperer une conversation avec ses messages
 */
export async function getConversation(schema: string, userId: string, conversationId: string) {
  const conversation = await chatDb.getConversationWithMessages(schema, conversationId, userId);
  if (!conversation) throw new Error("Conversation introuvable");
  return conversation;
}

/**
 * Supprimer une conversation
 */
export async function deleteConversation(schema: string, userId: string, conversationId: string) {
  const result = await chatDb.deleteConversation(schema, conversationId, userId);
  if (!result) throw new Error("Conversation introuvable");
  return { success: true };
}
