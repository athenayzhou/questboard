import { query } from "./db";
import { hashSessionToken } from "./betaAuth";
import { errorJson } from "./apiResponses";
import type { NextResponse } from "next/server";

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? "qb_session";

type SessionRow = {
  tester_id: string;
}

export async function getTesterIdFromRequest(req: Request): Promise<string | null> {
  const cookieHeader = req.headers.get("cookie") ?? "";
  const cookies = Object.fromEntries(
    cookieHeader
      .split(";")
      .map((c) => c.trim())
      .filter(Boolean)
      .map((c) => {
        const idx = c.indexOf("=");
        return [c.slice(0, idx), decodeURIComponent(c.slice(idx + 1))];
      }),
  );

  const rawToken = cookies[SESSION_COOKIE_NAME];
  if(!rawToken) return null;

  const tokenHash = hashSessionToken(rawToken);
  const sessionRes = await query<SessionRow>(
    `
    select tester_id
    from tester_sessions
    where session_token_hash = $1
      and expires_at > now()
    order by created_at desc
    limit 1
    `,
    [tokenHash],
  );

  return sessionRes.rows[0]?.tester_id ?? null;
}

export async function requireTesterId(
  req: Request,
): Promise<
  | { ok: true; testerId: string }
  | { ok: false; response: NextResponse }
> {
  const testerId = await getTesterIdFromRequest(req);
  if (!testerId) {
    return { ok: false, response: errorJson("unauthorized", 401) };
  }
  return { ok: true, testerId };
}