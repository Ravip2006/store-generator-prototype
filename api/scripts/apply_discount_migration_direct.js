/**
 * Direct SQL migration script to add discount columns to StoreProductOverride table
 * Run with: node api/scripts/apply_discount_migration_direct.js
 */

const { Pool } = require("pg");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({
  path: process.env.DOTENV_CONFIG_PATH || path.join(__dirname, "../.env"),
});

async function applyMigration() {
  const directUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
  
  if (!directUrl) {
    console.error("❌ Error: DIRECT_URL or DATABASE_URL not set in .env");
    process.exit(1);
  }

  // Always disable TLS verification for local dev with Supabase pooler
  const pool = new Pool({
    connectionString: directUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log("🔄 Connecting to database...");
    const client = await pool.connect();
    console.log("✅ Connected!");

    console.log("\n📋 Checking if discount columns exist...");
    
    const checkResult = await client.query(
      `SELECT column_name FROM information_schema.columns 
       WHERE table_name = 'StoreProductOverride' 
       AND column_name IN ('discountPercent', 'discountPrice')`
    );

    if (checkResult.rows.length === 2) {
      console.log("✅ Discount columns already exist!");
      client.release();
      return;
    }

    console.log("⚠️  Discount columns missing. Adding now...\n");

    // Add columns if they don't exist
    await client.query(`
      ALTER TABLE "StoreProductOverride"
      ADD COLUMN IF NOT EXISTS "discountPercent" DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS "discountPrice" DOUBLE PRECISION;
    `);
    console.log("✅ Added discountPercent and discountPrice columns");

    // Mark migration as applied
    const migrationName = "20260110090000_add_discounts";
    const checkMigrationResult = await client.query(
      `SELECT * FROM "_prisma_migrations" WHERE migration_name = $1`,
      [migrationName]
    );

    if (checkMigrationResult.rows.length === 0) {
      await client.query(
        `INSERT INTO "_prisma_migrations" (id, checksum, migration_name, logs, rolled_back_at, started_at, finished_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
        [
          `${Date.now()}-${migrationName}`,
          "checksum_not_computed",
          migrationName,
          "Discount columns added",
          null,
        ]
      );
      console.log("✅ Migration marked as applied in _prisma_migrations");
    } else {
      console.log("ℹ️  Migration already marked as applied");
    }

    console.log("\n✨ Migration completed successfully!");
    client.release();
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

applyMigration();
