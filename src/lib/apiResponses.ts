import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "unauthorized"
  | "invalid_json"
  | "invalid_payload"
  | "invalid_code"
  | "not_found"
  | "self"
  | "inviteKey_required"
  | "invalid_invite"
  | "invite_revoked"
  | "invite_expired"
  | "invite_max_uses_reached"
  | "body_required"
  | "body_too_long"
  | "rate_limited"
  | "server_error";

export function errorJson(
  error: ApiErrorCode,
  status: number,
  headers?: Record<string, string>,
) {
  return NextResponse.json({ ok: false, error }, { status, headers });
}

export async function parseJsonBody(
  req: Request,
): Promise<{ ok: true; data: unknown } | { ok: false; response: NextResponse }> {
  try {
    const data = await req.json();
    return { ok: true, data };
  } catch {
    return { ok: false, response: errorJson("invalid_json", 400) };
  }
}
