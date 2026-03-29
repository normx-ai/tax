import pool, { getValidatedSchemaName } from "./pool";
import fs from "fs";
import path from "path";

const SCHEMA_TEMPLATE = fs.readFileSync(
  path.join(__dirname, "tenant-schema.sql"),
  "utf-8"
);

// Cache des schemas deja crees (evite de verifier a chaque requete)
const schemaCache = new Set<string>();

export async function createTenantSchema(tenantSlug: string): Promise<string> {
  const schema = getValidatedSchemaName(tenantSlug);

  if (schemaCache.has(schema)) return schema;

  const exists = await pool.query(
    "SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1",
    [schema]
  );

  if (exists.rows.length > 0) {
    schemaCache.add(schema);
    return schema;
  }

  const sql = SCHEMA_TEMPLATE.replace(/\$\{schema\}/g, schema);
  await pool.query(sql);
  schemaCache.add(schema);

  console.log(`[tenant] Schema "${schema}" cree`);
  return schema;
}

export async function ensureUserInSchema(
  schema: string,
  userId: string,
  email: string,
  nom: string,
  prenom: string
): Promise<string> {
  const existing = await pool.query(
    `SELECT id FROM "${schema}".users WHERE id = $1`,
    [userId]
  );

  if (existing.rows.length > 0) return userId;

  await pool.query(
    `INSERT INTO "${schema}".users (id, email, nom, prenom) VALUES ($1, $2, $3, $4)
     ON CONFLICT (id) DO NOTHING`,
    [userId, email, nom, prenom]
  );

  return userId;
}
