/**
 * Operations DB Analytics / Usage Stats — Schema isolation
 */

import pool from "./pool";

export async function trackUsage(schema: string, userId: string, action: string, details?: Record<string, unknown>) {
  await pool.query(
    `INSERT INTO "${schema}".usage_stats (user_id, action, details) VALUES ($1, $2, $3)`,
    [userId, action, JSON.stringify(details || {})]
  );
}

export async function getUserStats(schema: string, userId: string) {
  const conversations = await pool.query(
    `SELECT COUNT(*) as c FROM "${schema}".conversations WHERE user_id = $1`, [userId]
  );
  const messages = await pool.query(
    `SELECT COUNT(*) as c FROM "${schema}".messages m
     JOIN "${schema}".conversations c ON c.id = m.conversation_id WHERE c.user_id = $1`, [userId]
  );
  const searches = await pool.query(
    `SELECT COUNT(*) as c FROM "${schema}".search_history WHERE user_id = $1`, [userId]
  );
  return {
    conversations: parseInt(conversations.rows[0]?.c || '0'),
    messages: parseInt(messages.rows[0]?.c || '0'),
    searches: parseInt(searches.rows[0]?.c || '0'),
  };
}

export async function getUsageByPeriod(schema: string, userId: string, days: number = 30) {
  const r = await pool.query(
    `SELECT DATE(created_at) as date, action, COUNT(*) as count
     FROM "${schema}".usage_stats WHERE user_id = $1 AND created_at > NOW() - INTERVAL '${days} days'
     GROUP BY DATE(created_at), action ORDER BY date DESC`,
    [userId]
  );
  return r.rows;
}
