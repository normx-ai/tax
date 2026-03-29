/**
 * Operations DB Alertes Fiscales — Schema isolation
 */

import pool from "./pool";

export async function listAlertes(schema: string, userId: string) {
  const r = await pool.query(
    `SELECT * FROM "${schema}".alertes_fiscales WHERE user_id = $1 ORDER BY date_echeance ASC`,
    [userId]
  );
  return r.rows;
}

export async function createAlerte(schema: string, userId: string, data: {
  type: string; titre: string; description?: string; date_echeance?: string;
}) {
  const r = await pool.query(
    `INSERT INTO "${schema}".alertes_fiscales (user_id, type, titre, description, date_echeance)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [userId, data.type, data.titre, data.description || null, data.date_echeance || null]
  );
  return r.rows[0];
}

export async function markAlerteLue(schema: string, id: string, userId: string) {
  await pool.query(
    `UPDATE "${schema}".alertes_fiscales SET lu = true WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
}

export async function deleteAlerte(schema: string, id: string, userId: string) {
  await pool.query(
    `DELETE FROM "${schema}".alertes_fiscales WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
}
