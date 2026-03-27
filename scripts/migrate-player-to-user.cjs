/**
 * Applies db/migrations/001_rename_player_to_user.sql (player_states → user_states, etc.).
 * Loads .env.local if present. Needs DATABASE_URL.
 *
 * Usage: node scripts/migrate-player-to-user.cjs
 */

const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

function loadEnvLocal() {
  const p = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(p)) return;
  const txt = fs.readFileSync(p, "utf8");
  for (const line of txt.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

async function main() {
  loadEnvLocal();
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("Missing DATABASE_URL (set in environment or .env.local)");
    process.exit(1);
  }

  const sqlPath = path.join(
    process.cwd(),
    "db/migrations/001_rename_player_to_user.sql",
  );
  const sql = fs.readFileSync(sqlPath, "utf8");

  const pool = new Pool({
    connectionString: dbUrl,
    ssl:
      /localhost|127\.0\.0\.1/.test(dbUrl) && !dbUrl.includes("sslmode=require")
        ? undefined
        : { rejectUnauthorized: false },
  });

  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log("OK: migration 001_rename_player_to_user applied.");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
