import { Pool } from "pg";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error("DATABASE_URL manquant — definir la variable d'environnement");
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
});

export default pool;

/**
 * Validation stricte des noms de schema tenant.
 *
 * Les schemas tenant doivent TOUJOURS matcher le pattern `tenant_[a-z0-9_]+`.
 * Toute autre forme est rejetee (dont les schemas reserves Postgres :
 * public, information_schema, pg_catalog, pg_toast).
 *
 * Cette fonction est la seule source de verite pour les noms de schemas
 * utilises dans des template literals SQL (raw queries).
 */
// Pattern strict : doit commencer par "tenant_", uniquement lettres/chiffres/underscore,
// longueur totale <= 63 (limite Postgres NAMEDATALEN - 1). Le prefixe tenant_ empeche
// toute collision avec les schemas reserves Postgres.
const TENANT_SCHEMA_REGEX = /^tenant_[a-z0-9_]{1,55}$/;

function isValidTenantSchema(schema: string): boolean {
  return TENANT_SCHEMA_REGEX.test(schema);
}

/**
 * Construit un nom de schema tenant a partir d'un slug utilisateur (ex: Keycloak sub).
 * Le slug est nettoye puis prefixe par `tenant_`, puis valide contre le pattern strict.
 */
export function getValidatedSchemaName(slug: string): string {
  const clean = slug.toLowerCase().replace(/[^a-z0-9_]/g, "_").substring(0, 55);
  const schema = `tenant_${clean}`;
  if (!isValidTenantSchema(schema)) {
    throw new Error(`Nom de schema invalide: ${slug}`);
  }
  return schema;
}

/**
 * Verifie qu'un nom de schema deja construit est safe pour etre injecte
 * dans une raw query via template literal.
 *
 * A appeler en entree des fonctions db qui prennent un parametre `schema: string`
 * pour se proteger contre un appel avec un schema non-valide (bug en amont,
 * future regression, etc). Defense en profondeur.
 *
 * Leve une exception si invalide — on ne veut pas masquer le bug, on veut
 * que l'appel echoue loud et clair avec un 500 plutot que d'executer une
 * requete avec un schema injectable.
 */
export function assertSafeSchemaName(schema: string): void {
  if (!schema || typeof schema !== "string") {
    throw new Error(`Nom de schema invalide (type): ${String(schema)}`);
  }
  if (!isValidTenantSchema(schema)) {
    throw new Error(`Nom de schema non-safe pour injection SQL: ${schema}`);
  }
}
