/**
 * Operations DB Chat — Schema isolation
 * Remplace les appels Prisma dans chat.service.ts
 */

import pool from "./pool";

export async function findConversation(schema: string, id: string, userId: string) {
  const r = await pool.query(
    `SELECT id, user_id AS "userId", title, agent, created_at AS "createdAt", updated_at AS "updatedAt"
     FROM "${schema}".conversations WHERE id = $1 AND user_id = $2`,
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
    `SELECT role, content FROM (
       SELECT role, content, created_at FROM "${schema}".messages
       WHERE conversation_id = $1 ORDER BY created_at DESC LIMIT $2
     ) recent ORDER BY created_at ASC`,
    [conversationId, limit]
  );
  return r.rows;
}

export async function listConversations(schema: string, userId: string) {
  const r = await pool.query(
    `SELECT c.id, c.title, c.agent, c.created_at AS "createdAt", c.updated_at AS "updatedAt",
       (SELECT COUNT(*) FROM "${schema}".messages m WHERE m.conversation_id = c.id)::int AS "_count_messages",
       (SELECT content FROM "${schema}".messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message
     FROM "${schema}".conversations c WHERE c.user_id = $1 ORDER BY c.updated_at DESC`,
    [userId]
  );
  return r.rows.map((row) => ({
    ...row,
    _count: { messages: row._count_messages },
  }));
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
    `SELECT id, conversation_id AS "conversationId", role, content, articles_refs AS "citations", created_at AS "createdAt"
     FROM "${schema}".messages WHERE conversation_id = $1 ORDER BY created_at ASC`,
    [id]
  );
  return {
    id: conv.id,
    title: conv.title,
    createdAt: conv.created_at,
    updatedAt: conv.updated_at,
    messages: msgs.rows,
  };
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
