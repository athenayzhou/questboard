import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { hashInviteKey, hashSessionToken, makeSessionToken } from "@/lib/betaAuth";
import { assignPlayerCodeIfMissing } from "@/lib/playerCode";

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

export async function POST(req: Request){
  try {
    const body = (await req.json()) as { inviteKey?: string };
    const inviteKey = body?.inviteKey?.trim();

    if(!inviteKey){
      return NextResponse.json({ ok: false, error: "inviteKey_required" }, { status: 400 });
    }

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
      return NextResponse.json({ ok: false, error: "invalid_invite" }, { status: 401 });
    }
    if(invite.revoked_at){
      return NextResponse.json({ ok: false, error: "invite_revoked" }, { status: 401 });
    }
    if(invite.expires_at && new Date(invite.expires_at).getTime() <= Date.now()){
      return NextResponse.json({ ok: false, error: "invite_expired" }, { status: 401 });
    }
    if(invite.max_uses !== null && invite.used_count >= invite.max_uses){
      return NextResponse.json({ ok: false, error: "invite_max_uses_reached" }, { status: 401 });
    }

    // await query("begin");

    let testerId = invite.assigned_tester_id;
    if(!testerId){
      const testerRes = await query<{ id: string }>(
        `insert into testers default values returning id`,
      );
      testerId = testerRes.rows[0].id;
      await query(
        `update beta_invites set assigned_tester_id = $1 where id = $2`,
        [testerId, invite.id],
      );
    }

    await query(
      `update beta_invites set used_count = used_count + 1 where id = $1`,
      [invite.id],
    );

    const rawToken = makeSessionToken();
    const tokenHash = hashSessionToken(rawToken);

    await query(
      `
      insert into tester_sessions (tester_id, session_token_hash, expires_at)
      values ($1, $2, now() + ($3 || ' days')::interval)
      `,
      [testerId, tokenHash, String(SESSION_TTL_DAYS)],
    );

    // await query("commit");

    await assignPlayerCodeIfMissing(testerId);

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
    // await query("rollback").catch(() => undefined);
    console.error("POST /api/beta/session failed:", error);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}