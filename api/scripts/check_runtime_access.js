// Quick sanity check: can the runtime (APP_DATABASE_URL) user read from Store?
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
require("dotenv/config");

const { Pool } = require("pg");

async function main() {
  const runtimeUrl = process.env.APP_DATABASE_URL;
  if (!runtimeUrl) throw new Error("Missing APP_DATABASE_URL");

  const pool = new Pool({
    connectionString: runtimeUrl,
    ssl: process.env.PG_TLS_INSECURE === "1" ? { rejectUnauthorized: false } : undefined,
  });

  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      "select id, slug, name, phone, \"themeColor\" from public.\"Store\" where slug = $1 limit 1",
      ["green-mart"]
    );
    console.log(rows[0] || null);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
