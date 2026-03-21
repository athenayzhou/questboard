/**
 * Inserts a dedicated beta tester + invite + rich game rows in Postgres.
 *
 * Requires DATABASE_URL + INVITE_HMAC_SECRET (same as the app).
 * Loads `.env.local` when present.
 *
 * Usage (in terminal):
 *   npm run db:seed-beta
 *   SEED_BETA_INVITE_CODE="QUESTBOARD-BETA-SEED" pnpm db:seed-beta
 *
 * Then sign in with the printed invite code at the beta gate.
 */
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { Pool } from "pg";
import {
  buildBetaSeedPlayer,
  buildBetaSeedQuestsForDb,
  buildBetaSeedSkillsForDb,
  buildBetaSeedClientGameBlob,
} from "../src/dev/seed/buildDbBetaPayload";

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

function hashInviteKey(secret: string, inviteKey: string) {
  return crypto.createHmac("sha256", secret).update(inviteKey).digest("hex");
}

async function main() {
  loadEnvLocal();

  const secret = process.env.INVITE_HMAC_SECRET;
  const dbUrl = process.env.DATABASE_URL;
  const inviteCode =
    process.env.SEED_BETA_INVITE_CODE?.trim() || "QUESTBOARD-BETA-SEED";

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

  const player = buildBetaSeedPlayer();
  const quests = buildBetaSeedQuestsForDb();
  const skills = buildBetaSeedSkillsForDb();
  const clientGame = buildBetaSeedClientGameBlob();
  const codeHash = hashInviteKey(secret, inviteCode);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const dup = await client.query<{ id: string }>(
      `select id from beta_invites where code_hash = $1 limit 1`,
      [codeHash]
    );
    if (dup.rows.length > 0) {
      console.error(
        `Invite code already exists (hash collision). Use a different SEED_BETA_INVITE_CODE.\n` +
          `  Current: ${inviteCode}`
      );
      process.exit(1);
    }

    const testerRes = await client.query<{ id: string }>(
      `insert into testers default values returning id`
    );
    const testerId = testerRes.rows[0].id;

    const playerCode = `QB-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
    await client.query(
      `update testers set player_code = $1 where id = $2`,
      [playerCode, testerId],
    );

    await client.query(
      `insert into beta_invites (code_hash, max_uses, expires_at, revoked_at, used_count, assigned_tester_id)
       values ($1, null, null, null, 0, $2)`,
      [codeHash, testerId]
    );

    await client.query(
      `insert into player_states (tester_id, data, updated_at)
       values ($1, $2::jsonb, now())
       on conflict (tester_id) do update set data = excluded.data, updated_at = now()`,
      [testerId, JSON.stringify(player)]
    );

    await client.query(`delete from quests where tester_id = $1`, [testerId]);
    for (const q of quests) {
      await client.query(
        `insert into quests (id, tester_id, data, status, created_at, updated_at)
         values ($1::uuid, $2::uuid, $3::jsonb, $4, $5, now())`,
        [
          q.id,
          testerId,
          JSON.stringify(q),
          q.status,
          typeof q.createdAt === "number" ? q.createdAt : Date.now(),
        ]
      );
    }

    await client.query(`delete from skills where tester_id = $1`, [testerId]);
    for (const s of skills) {
      await client.query(
        `insert into skills (id, tester_id, data, updated_at)
         values ($1::uuid, $2::uuid, $3::jsonb, now())`,
        [s.id, testerId, JSON.stringify(s)]
      );
    }

    await client.query(`delete from xp_events where tester_id = $1`, [testerId]);

    await client.query(
      `insert into client_game_state (tester_id, data, updated_at)
       values ($1, $2::jsonb, now())
       on conflict (tester_id) do update set data = excluded.data, updated_at = now()`,
      [testerId, JSON.stringify(clientGame)]
    );

    await client.query("COMMIT");

    console.log("Seeded beta user OK.");
    console.log("  tester_id:", testerId);
    console.log("  Sign in with invite code (type exactly):");
    console.log("   ", inviteCode);
    console.log(
      "  (quests:",
      quests.length,
      "| skills:",
      skills.length,
      "| masteries:",
      clientGame.masteries.length,
      ")"
    );
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
