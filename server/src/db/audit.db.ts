/**
 * Operations DB Audit — Schema isolation
 */

import pool, { assertSafeSchemaName } from "./pool";

export async function createAuditLog(schema: string, data: {
  actorId: string;
  actorEmail?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  ipAddress?: string;
  changes?: Record<string, unknown>;
}) {
  assertSafeSchemaName(schema);
  await pool.query(
    `INSERT INTO "${schema}".audit_log (actor_id, actor_email, action, entity_type, entity_id, ip_address, changes)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [data.actorId, data.actorEmail || '', data.action, data.entityType || '', data.entityId || '', data.ipAddress || '', JSON.stringify(data.changes || {})]
  );
}

export async function getAuditLogs(schema: string, limit: number = 50, offset: number = 0) {
  assertSafeSchemaName(schema);
  const r = await pool.query(
    `SELECT id, actor_id AS "actorId", actor_email AS "actorEmail", action, entity_type AS "entityType", entity_id AS "entityId", ip_address AS "ipAddress", changes, created_at AS "createdAt"
     FROM "${schema}".audit_log ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return r.rows;
}
