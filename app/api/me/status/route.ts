import { NextResponse } from "next/server";
import { getTesterIdFromRequest } from "@/lib/session";
import { query } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const testerId = await getTesterIdFromRequest(req);
    if(!testerId){
      return NextResponse.json({ ok: false, error: "unauthroized" }, { status: 401 });
    }

    await query(`update testers set last_seen_at = now() where id = $1`, [testerId]);

    return NextResponse.json({ ok: true });
  } catch(error) {
    console.error("POST /api/me/status failed:", error);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 })
  }
}