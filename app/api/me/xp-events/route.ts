import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getTesterIdFromRequest } from "@/lib/session";

type XPEventLike = {
  id?: string;
};

export async function PUT(req: Request) {
  try {
    const testerId = await getTesterIdFromRequest(req);
    if (!testerId) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as { xpEvents?: unknown };
    if (!Array.isArray(body?.xpEvents)) {
      return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
    }

    const xpEvents = body.xpEvents as XPEventLike[];

    await query(`delete from xp_events where tester_id = $1`, [testerId]);

    for (const e of xpEvents) {
      if (!e?.id || typeof e.id !== "string") continue;
      await query(
        `
        insert into xp_events (id, tester_id, data, updated_at)
        values ($1::uuid, $2::uuid, $3::jsonb, now())
        `,
        [e.id, testerId, JSON.stringify(e)],
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PUT /api/me/xp-events failed:", error);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}