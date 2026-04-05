import { Pool } from "pg";

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://cgi242:password@localhost:5432/cgi242";

const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
});

export default pool;

const RESERVED_SCHEMAS = ['public', 'information_schema', 'pg_catalog', 'pg_toast'];
const SCHEMA_REGEX = /^[a-z][a-z0-9_]{0,62}$/;

export function getValidatedSchemaName(slug: string): string {
  const clean = slug.toLowerCase().replace(/[^a-z0-9_]/g, "_").substring(0, 63);
  const schema = `tenant_${clean}`;
  if (!schema || !SCHEMA_REGEX.test(schema)) {
    throw new Error(`Nom de schema invalide: ${slug}`);
  }
  if (RESERVED_SCHEMAS.includes(schema)) {
    throw new Error(`Schema réservé interdit: ${schema}`);
  }
  return schema;
}
