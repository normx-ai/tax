// server/src/services/chat.service.ts
// Service chat IA fiscal - RAG hybride + Claude API + schema PostgreSQL isolation

import Anthropic from "@anthropic-ai/sdk";
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
  const assistantContent = response.content?.[0]?.type === "text" ? response.content[0].text : "";
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

  const stream = anthropic.messages.stream({
    model: CLAUDE_MODEL,
    max_tokens: MAX_TOKENS,
    system: systemPrompt,
    messages: previousMessages.map((msg) => ({
      role: msg.role === "USER" ? "user" as const : "assistant" as const,
      content: msg.content,
    })),
  });

  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      fullContent += event.delta.text;
      yield { event: "chunk", data: JSON.stringify({ text: event.delta.text }) };
    }
  }

  const finalMessage = await stream.finalMessage();
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
