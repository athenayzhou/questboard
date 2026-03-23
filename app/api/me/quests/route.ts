import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getTesterIdFromRequest } from "@/lib/session";
import { questRowIdFromClientId } from "@/lib/questRowId";

type QuestLike = {
  id?: string;
  status?: string;
  createdAt?: number;
};

export async function PUT(req: Request) {
  try{
    const testerId = await getTesterIdFromRequest(req);
    if(!testerId){
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as { quests?: unknown };
    if(!Array.isArray(body?.quests)) {
      return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
    }

    const quests = body.quests as QuestLike[];

    const byRowId = new Map<string, QuestLike>();
    for (const q of quests) {
      if (!q?.id || typeof q.id !== "string") continue;
      const rowId = questRowIdFromClientId(q.id, testerId);
      byRowId.set(rowId, q);
    }

    await query(`delete from quests where tester_id = $1`, [testerId]);

    for (const [rowId, q] of byRowId) {
      await query(
        `
        insert into quests (id, tester_id, data, status, created_at, updated_at)
        values ($1::uuid, $2::uuid, $3::jsonb, $4, $5, now())
        `,
        [
          rowId,
          testerId,
          JSON.stringify(q),
          typeof q.status === "string" ? q.status : "available",
          typeof q.createdAt === "number" ? q.createdAt : Date.now(),
        ],
      );
    }
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PUT /api/me/quests failed:", error);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}