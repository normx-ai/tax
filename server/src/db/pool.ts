import { Pool } from "pg";

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://cgi242:password@localhost:5432/cgi242";

const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
});

export default pool;

export function getValidatedSchemaName(slug: string): string {
  const clean = slug.toLowerCase().replace(/[^a-z0-9_]/g, "_").substring(0, 63);
  const schema = `tenant_${clean}`;
  if (!schema || !/^[a-z]/.test(schema)) {
    throw new Error(`Nom de schema invalide: ${slug}`);
  }
  return schema;
}
