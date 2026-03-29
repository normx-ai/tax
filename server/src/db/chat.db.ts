/**
 * Operations DB Chat — Schema isolation
 * Remplace les appels Prisma dans chat.service.ts
 */

import pool from "./pool";

export async function findConversation(schema: string, id: string, userId: string) {
  const r = await pool.query(
    `SELECT * FROM "${schema}".conversations WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
  return r.rows[0] || null;
}

export async function createConversation(schema: string, userId: string, title: string) {
  const r = await pool.query(
    `INSERT INTO "${schema}".conversations (user_id, title) VALUES ($1, $2) RETURNING *`,
    [userId, title]
  );
  return r.rows[0];
}

export async function createMessage(
  schema: string,
  conversationId: string,
  userId: string,
  role: string,
  content: string,
  articlesRefs?: unknown[]
) {
  const r = await pool.query(
    `INSERT INTO "${schema}".messages (conversation_id, role, content, articles_refs)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [conversationId, role, content, JSON.stringify(articlesRefs || [])]
  );
  return r.rows[0];
}

export async function getMessages(schema: string, conversationId: string, limit: number = 20) {
  const r = await pool.query(
    `SELECT role, content FROM "${schema}".messages
     WHERE conversation_id = $1 ORDER BY created_at ASC LIMIT $2`,
    [conversationId, limit]
  );
  return r.rows;
}

export async function listConversations(schema: string, userId: string) {
  const r = await pool.query(
    `SELECT c.*,
       (SELECT content FROM "${schema}".messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message
     FROM "${schema}".conversations c WHERE c.user_id = $1 ORDER BY c.updated_at DESC`,
    [userId]
  );
  return r.rows;
}

export async function deleteConversation(schema: string, id: string, userId: string) {
  const conv = await findConversation(schema, id, userId);
  if (!conv) return null;
  await pool.query(`DELETE FROM "${schema}".conversations WHERE id = $1`, [id]);
  return conv;
}

export async function getConversationWithMessages(schema: string, id: string, userId: string) {
  const conv = await findConversation(schema, id, userId);
  if (!conv) return null;
  const msgs = await pool.query(
    `SELECT * FROM "${schema}".messages WHERE conversation_id = $1 ORDER BY created_at ASC`,
    [id]
  );
  return { ...conv, messages: msgs.rows };
}

export async function updateConversationTitle(schema: string, id: string, title: string) {
  await pool.query(
    `UPDATE "${schema}".conversations SET title = $1, updated_at = NOW() WHERE id = $2`,
    [title, id]
  );
}

export async function createSearchHistory(schema: string, userId: string, query: string, resultsCount: number) {
  await pool.query(
    `INSERT INTO "${schema}".search_history (user_id, query, results_count) VALUES ($1, $2, $3)`,
    [userId, query, resultsCount]
  );
}
