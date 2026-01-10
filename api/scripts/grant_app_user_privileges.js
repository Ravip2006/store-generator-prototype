// Grant schema/table/sequence privileges to the runtime RLS user (APP_DATABASE_URL user)
// Run with DATABASE_URL set to an admin/owner connection string.

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
require("dotenv/config");

const { Pool } = require("pg");

function parseDbUser(connectionString) {
  try {
    const url = new URL(connectionString);
    // URL username is percent-decoded already in WHATWG URL
    return url.username;
  } catch {
    // Fallback: try to parse "postgresql://user:pass@host/db"
    const match = String(connectionString).match(/^\w+:\/\/([^:]+):/);
    return match ? match[1] : null;
  }
}

function quoteIdent(identifier) {
  // Quote identifiers safely for Postgres (handles dots in role names)
  return '"' + String(identifier).replace(/"/g, '""') + '"';
}

async function main() {
  const adminUrl = process.env.DATABASE_URL;
  const appUrl = process.env.APP_DATABASE_URL;

  if (!adminUrl) throw new Error("Missing DATABASE_URL (admin/owner connection string)");
  if (!appUrl) throw new Error("Missing APP_DATABASE_URL (runtime RLS connection string)");

  const appUserFromUrl = parseDbUser(appUrl);
  if (!appUserFromUrl) throw new Error("Could not parse username from APP_DATABASE_URL");

  const pool = new Pool({
    connectionString: adminUrl,
    ssl: process.env.PG_TLS_INSECURE === "1" ? { rejectUnauthorized: false } : undefined,
  });

  const client = await pool.connect();

  // Supabase pooler usernames often look like app_user.<project_ref>, but the actual role
  // inside Postgres is typically just app_user. Resolve the real role before granting.
  const roleCandidates = Array.from(
    new Set([
      appUserFromUrl,
      String(appUserFromUrl).includes(".") ? String(appUserFromUrl).split(".")[0] : null,
    ].filter(Boolean))
  );

  let resolvedRole = null;
  try {
    for (const candidate of roleCandidates) {
      const { rowCount } = await client.query(
        "select 1 from pg_roles where rolname = $1",
        [candidate]
      );
      if (rowCount > 0) {
        resolvedRole = candidate;
        break;
      }
    }

    if (!resolvedRole) {
      const prefix = String(appUserFromUrl).includes(".")
        ? String(appUserFromUrl).split(".")[0]
        : String(appUserFromUrl);
      const { rows } = await client.query(
        "select rolname from pg_roles where rolname ilike $1 order by rolname asc",
        [`${prefix}%`]
      );
      throw new Error(
        `Could not find a matching Postgres role for APP_DATABASE_URL user '${appUserFromUrl}'. Candidates tried: ${roleCandidates.join(
          ", "
        )}. Roles found with prefix '${prefix}': ${rows.map((r) => r.rolname).join(", ") || "(none)"}`
      );
    }

    const role = quoteIdent(resolvedRole);

  // Grants needed even when RLS is used. RLS policies are evaluated only after basic privileges.
  const statements = [
    `GRANT USAGE ON SCHEMA public TO ${role};`,
    `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${role};`,
    `GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${role};`,
    // Ensure future tables/sequences created by this admin role also grant privileges
    `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${role};`,
    `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO ${role};`,
  ];

    for (const sql of statements) {
      await client.query(sql);
    }
  } finally {
    client.release();
    await pool.end();
  }

  console.log(`Granted schema/table/sequence privileges to role: ${resolvedRole}`);
}

main().catch((e) => {
  console.error("Failed to grant privileges:", e?.message || e);
  process.exit(1);
});
