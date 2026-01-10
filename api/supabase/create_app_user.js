require("dotenv/config");

const { Pool } = require("pg");

if (process.env.PG_TLS_INSECURE === "1" && !process.env.NODE_TLS_REJECT_UNAUTHORIZED) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

const adminUrl = process.env.DATABASE_URL;
const appUrl = process.env.APP_DATABASE_URL;

if (!adminUrl) throw new Error("Missing DATABASE_URL (admin connection). ");
if (!appUrl) throw new Error("Missing APP_DATABASE_URL (runtime connection).");

function parseRoleAndPassword(connectionString) {
  const url = new URL(connectionString);
  // Pooler usernames are like app_user.<projectRef>; the actual DB role is app_user
  const rawUser = decodeURIComponent(url.username || "");
  const role = rawUser.split(".")[0];
  const password = decodeURIComponent(url.password || "");
  if (!role) throw new Error("Could not parse username from APP_DATABASE_URL");
  if (!password) throw new Error("Could not parse password from APP_DATABASE_URL");
  return { role, password };
}

function quoteIdent(identifier) {
  return `"${String(identifier).replaceAll('"', '""')}"`;
}

function quoteLiteral(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

async function main() {
  const { role, password } = parseRoleAndPassword(appUrl);
  const roleIdent = quoteIdent(role);
  const passwordLiteral = quoteLiteral(password);

  const pool = new Pool({
    connectionString: adminUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    // Create role (ignore if it already exists)
    try {
      await pool.query(
        `CREATE ROLE ${roleIdent} LOGIN PASSWORD ${passwordLiteral} NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT`
      );
      console.log(`✅ Created role ${role}`);
    } catch (e) {
      // 42710 = duplicate_object
      if (e && e.code === "42710") {
        console.log(`ℹ️ Role ${role} already exists`);
      } else {
        throw e;
      }
    }

    // Grants
    await pool.query(`GRANT USAGE ON SCHEMA public TO ${roleIdent}`);
    await pool.query(`GRANT CONNECT ON DATABASE postgres TO ${roleIdent}`);
    await pool.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${roleIdent}`);
    await pool.query(`GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO ${roleIdent}`);

    // Default privileges for future objects created in public
    await pool.query(
      `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${roleIdent}`
    );
    await pool.query(
      `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO ${roleIdent}`
    );

    console.log("✅ Granted privileges to runtime role");
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
