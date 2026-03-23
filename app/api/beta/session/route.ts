import { NextResponse } from "next/server";
import { query, withTransaction } from "@/lib/db";
import { hashInviteKey, hashSessionToken, makeSessionToken } from "@/lib/betaAuth";
import { assignUserCodeIfMissing } from "@/lib/userCode";
import { consumeRateLimit, requestIp } from "@/lib/rateLimit";
import { errorJson, parseJsonBody } from "@/lib/apiResponses";
import { z } from "zod";

type InviteRow = {
  id: string;
  assigned_tester_id: string | null;
  expires_at: string | null;
  revoked_at: string | null;
  max_uses: number | null;
  used_count: number;
}

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? "qb_session";
const SESSION_TTL_DAYS = Number(process.env.SESSION_TTL_DAYS ?? "30");
const SESSION_ATTEMPT_LIMIT = 10;
const SESSION_ATTEMPT_WINDOW_MS = 60_000;

const sessionRequestSchema = z.object({
  inviteKey: z.string().trim().min(1, "inviteKey_required"),
});

export async function POST(req: Request){
  try {
    const rateKey = `beta-session:${requestIp(req)}`;
    const gate = consumeRateLimit({
      key: rateKey,
      limit: SESSION_ATTEMPT_LIMIT,
      windowMs: SESSION_ATTEMPT_WINDOW_MS,
    });
    if (!gate.allowed) {
      return errorJson("rate_limited", 429, {
        "retry-after": String(gate.retryAfterSec),
      });
    }
    const parsedBody = await parseJsonBody(req);
    if (!parsedBody.ok) return parsedBody.response;
    const parsed = sessionRequestSchema.safeParse(parsedBody.data);
    if (!parsed.success) {
      return errorJson("inviteKey_required", 400);
    }
    const inviteKey = parsed.data.inviteKey;

    const codeHash = hashInviteKey(inviteKey);
    const inviteRes = await query<InviteRow>(
      `
      select id, assigned_tester_id, expires_at, revoked_at, max_uses, used_count
      from beta_invites
      where code_hash = $1
      limit 1
      `,
      [codeHash],
    );

    const invite = inviteRes.rows[0];
    if(!invite){
      return errorJson("invalid_invite", 401);
    }
    if(invite.revoked_at){
      return errorJson("invite_revoked", 401);
    }
    if(invite.expires_at && new Date(invite.expires_at).getTime() <= Date.now()){
      return errorJson("invite_expired", 401);
    }
    if(invite.max_uses !== null && invite.used_count >= invite.max_uses){
      return errorJson("invite_max_uses_reached", 401);
    }

    const rawToken = makeSessionToken();
    const tokenHash = hashSessionToken(rawToken);

    const testerId = await withTransaction(async (txQuery) => {
      let nextTesterId = invite.assigned_tester_id;
      if(!nextTesterId){
        const testerRes = await txQuery<{ id: string }>(
          `insert into testers default values returning id`,
        );
        nextTesterId = testerRes.rows[0].id;
        await txQuery(
          `update beta_invites set assigned_tester_id = $1 where id = $2`,
          [nextTesterId, invite.id],
        );
      }

      await txQuery(
        `update beta_invites set used_count = used_count + 1 where id = $1`,
        [invite.id],
      );

      await txQuery(
        `
        insert into tester_sessions (tester_id, session_token_hash, expires_at)
        values ($1, $2, now() + ($3 || ' days')::interval)
        `,
        [nextTesterId, tokenHash, String(SESSION_TTL_DAYS)],
      );

      return nextTesterId;
    });

    await assignUserCodeIfMissing(testerId);

    const res = NextResponse.json({ ok: true });
    res.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: rawToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
    });

    return res;
  } catch (error) {
    console.error("POST /api/beta/session failed:", error);
    return errorJson("server_error", 500);
  }
}