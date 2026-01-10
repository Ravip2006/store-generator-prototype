require("dotenv/config");

const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

// Workaround for some local Node TLS setups (not recommended for production).
// If you hit TLS chain errors, run with: NODE_TLS_REJECT_UNAUTHORIZED=0
// or set PG_TLS_INSECURE=1 in your env.
if (process.env.PG_TLS_INSECURE === "1" && !process.env.NODE_TLS_REJECT_UNAUTHORIZED) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("Missing DATABASE_URL (admin connection) required to apply RLS.");
}

async function main() {
  const sqlPath = path.join(__dirname, "rls.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await pool.query(sql);
    console.log("✅ Applied RLS policies from supabase/rls.sql");
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
