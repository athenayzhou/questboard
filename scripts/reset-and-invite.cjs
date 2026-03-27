/**
 * Wipes tester data + all beta_invites, then adds ten invites:
 *   QUESTBOARD-BETA-000 .. QUESTBOARD-BETA-009
 *
 * Needs DATABASE_URL + INVITE_HMAC_SECRET (same as the running app).
 * Loads .env.local if present.
 * 
 * Usage (in terminal):
 *    node scripts/reset-and-invite.cjs
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
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

function hashInviteKey(secret, inviteKey) {
  return crypto.createHmac("sha256", secret).update(inviteKey).digest("hex");
}

const CODES = Array.from({ length: 10 }, (_, i) =>
  `QUESTBOARD-BETA-${String(i).padStart(3, "0")}`,
);

async function main() {
  loadEnvLocal();

  const secret = process.env.INVITE_HMAC_SECRET;
  const dbUrl = process.env.DATABASE_URL;
  if (!secret) {
    console.error("Missing INVITE_HMAC_SECRET");
    process.exit(1);
  }
  if (!dbUrl) {
    console.error("Missing DATABASE_URL");
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: dbUrl,
    ssl:
      /localhost|127\.0\.0\.1/.test(dbUrl) && !dbUrl.includes("sslmode=require")
        ? undefined
        : { rejectUnauthorized: false },
  });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query("delete from client_game_state");
    await client.query("delete from xp_events");
    await client.query("delete from skills");
    await client.query("delete from quests");
    await client.query("delete from user_states");
    await client.query("delete from tester_sessions");
    await client.query("delete from beta_invites");
    await client.query("delete from testers");

    for (const code of CODES) {
      const codeHash = hashInviteKey(secret, code);
      await client.query(
        `insert into beta_invites (code_hash, max_uses, expires_at, revoked_at, used_count)
         values ($1, null, null, null, 0)`,
        [codeHash],
      );
    }

    await client.query("COMMIT");
    console.log("OK. Invite codes (type exactly):");
    CODES.forEach((c) => console.log("  ", c));
  } catch (e) {
    await client.query("ROLLBACK");
    console.error(e);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();