import { NextResponse } from "next/server";
import { requireTesterId } from "@/lib/session";
import { query } from "@/lib/db";
import { errorJson } from "@/lib/apiResponses";

export async function POST(req: Request) {
  try {
    const auth = await requireTesterId(req);
    if (!auth.ok) return auth.response;

    await query(`update testers set last_seen_at = now() where id = $1`, [auth.testerId]);

    return NextResponse.json({ ok: true });
  } catch(error) {
    console.error("POST /api/me/status failed:", error);
    return errorJson("server_error", 500);
  }
}