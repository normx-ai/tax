/**
 * Operations DB Audit — Schema isolation
 */

import pool from "./pool";

export async function createAuditLog(schema: string, data: {
  actorId: string;
  actorEmail?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  ipAddress?: string;
  changes?: Record<string, unknown>;
}) {
  await pool.query(
    `INSERT INTO "${schema}".audit_log (actor_id, actor_email, action, entity_type, entity_id, ip_address, changes)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [data.actorId, data.actorEmail || '', data.action, data.entityType || '', data.entityId || '', data.ipAddress || '', JSON.stringify(data.changes || {})]
  );
}

export async function getAuditLogs(schema: string, limit: number = 50, offset: number = 0) {
  const r = await pool.query(
    `SELECT * FROM "${schema}".audit_log ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return r.rows;
}
