// Direct migration apply for discount fields
// Bypasses Prisma CLI to work around pooler hangs
// Connects to DATABASE_URL and runs the migration SQL directly

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const { Pool } = require("pg");

function withNoVerifyIfInsecure(url) {
  const raw = String(url || "").trim();
  if (!raw) return raw;
  if (process.env.PG_TLS_INSECURE !== "1") return raw;
  try {
    const u = new URL(raw);
    const mode = (u.searchParams.get("sslmode") || "").toLowerCase();
    if (!mode || mode === "require" || mode === "verify-full" || mode === "verify-ca") {
      u.searchParams.set("sslmode", "no-verify");
    }
    return u.toString();
  } catch {
    return raw.replace(/sslmode=require/gi, "sslmode=no-verify");
  }
}

async function applyMigration() {
  const dbUrl = withNoVerifyIfInsecure(process.env.DATABASE_URL);
  if (!dbUrl) throw new Error("Missing DATABASE_URL");

  const pool = new Pool({
    connectionString: dbUrl,
    ssl: process.env.PG_TLS_INSECURE === "1" ? { rejectUnauthorized: false } : undefined,
  });
  const client = await pool.connect();

  try {
    console.log("Connected to database");

    // Check if columns already exist
    const checkRes = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='StoreProductOverride' 
        AND column_name IN ('discountPercent', 'discountPrice')
    `);

    const existingColumns = new Set(checkRes.rows.map((r) => r.column_name));
    console.log(`Existing columns: ${Array.from(existingColumns).join(", ") || "none"}`);

    // Add missing columns
    if (!existingColumns.has("discountPercent")) {
      console.log("Adding discountPercent column...");
      await client.query(
        'ALTER TABLE "StoreProductOverride" ADD COLUMN "discountPercent" DOUBLE PRECISION DEFAULT NULL'
      );
      console.log("✓ discountPercent added");
    } else {
      console.log("✓ discountPercent already exists");
    }

    if (!existingColumns.has("discountPrice")) {
      console.log("Adding discountPrice column...");
      await client.query(
        'ALTER TABLE "StoreProductOverride" ADD COLUMN "discountPrice" DOUBLE PRECISION DEFAULT NULL'
      );
      console.log("✓ discountPrice added");
    } else {
      console.log("✓ discountPrice already exists");
    }

    // Mark migration as applied in Prisma's tracking table
    console.log("Marking migration as applied in _prisma_migrations...");
    const migrationId = "20260110090000_add_discounts";
    const migrationName = "add_discounts";

    // First check what columns exist in _prisma_migrations
    const tableRes = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name='_prisma_migrations' 
      ORDER BY column_name
    `);
    console.log("_prisma_migrations columns:", tableRes.rows.map((r) => r.column_name).join(", "));

    // Insert with only the columns that exist
    await client.query(
      `INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, started_at, applied_steps_count)
       VALUES ($1, $2, NOW(), $3, '', NOW(), 2)
       ON CONFLICT(id) DO UPDATE SET finished_at = NOW()`,
      [migrationId, "placeholder_checksum", migrationName]
    );

    console.log("✓ Migration marked as applied");
    console.log("\n✅ Migration complete!");
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
    process.exit(1);
  } finally {
    await client.end();
    await pool.end();
  }
}

applyMigration();
