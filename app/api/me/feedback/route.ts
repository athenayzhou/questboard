import { NextResponse } from "next/server";
import { getTesterIdFromRequest } from "@/lib/session";
import { query } from "@/lib/db";
import { getDisplayNameForTester } from "@/lib/playerDisplayName";

const MAX_BODY = 8000;

export async function POST(req: Request){
  try {
    const testerId = await getTesterIdFromRequest(req);
    if(!testerId){
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    let json: { kind?: string; body?: string };
    try {
      json = (await req.json()) as { kind?: string; body?: string };
    } catch {
      return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 })
    }

    const kind = json.kind === "problem" ? "problem" : "feedback";
    const body = typeof json.body === "string" ? json.body.trim() : "";
    if(!body){
      return NextResponse.json({ ok: false, error: "body_required" }, { status: 400 });
    }
    if (body.length > MAX_BODY) {
      return NextResponse.json({ ok: false, error: "body_too_long" }, { status: 400 });
    }

    const displayNameSnapshot = await getDisplayNameForTester(testerId);

    await query(
      `
      insert into feedback (tester_id, kind, body, display_name_snapshot)
      values ($1, $2, $3, $4)
      `,
      [testerId, kind, body, displayNameSnapshot],
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/me/feedback failed:", error);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 })
  }
}