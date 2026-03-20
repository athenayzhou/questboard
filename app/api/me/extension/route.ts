import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getTesterIdFromRequest } from "@/lib/session";

export async function PUT(req: Request) {
  try {
    const testerId = await getTesterIdFromRequest(req);
    if (!testerId) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as { clientGame?: unknown };
    if (!body?.clientGame || typeof body.clientGame !== "object") {
      return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
    }

    await query(
      `
      insert into client_game_state (tester_id, data, updated_at)
      values ($1, $2::jsonb, now())
      on conflict (tester_id)
      do update set data = excluded.data, updated_at = now()
      `,
      [testerId, JSON.stringify(body.clientGame)],
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PUT /api/me/extension failed:", error);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
