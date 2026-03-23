import { NextResponse } from "next/server";
import { withTransaction } from "@/lib/db";
import { requireTesterId } from "@/lib/session";
import { questRowIdFromClientId } from "@/lib/questRowId";
import { errorJson, parseJsonBody } from "@/lib/apiResponses";
import { z } from "zod";

type QuestLike = {
  id?: string;
  status?: string;
  createdAt?: number;
};

const questSchema = z
  .object({
    id: z.string().optional(),
    status: z.string().optional(),
    createdAt: z.number().optional(),
  })
  .passthrough();

const questPayloadSchema = z.object({
  quests: z.array(questSchema),
});

export async function PUT(req: Request) {
  try{
    const auth = await requireTesterId(req);
    if (!auth.ok) return auth.response;

    const parsedBody = await parseJsonBody(req);
    if (!parsedBody.ok) return parsedBody.response;
    const parsed = questPayloadSchema.safeParse(parsedBody.data);
    if(!parsed.success) {
      return errorJson("invalid_payload", 400);
    }

    const quests = parsed.data.quests as QuestLike[];

    const byRowId = new Map<string, QuestLike>();
    for (const q of quests) {
      if (!q?.id || typeof q.id !== "string") continue;
      const rowId = questRowIdFromClientId(q.id, auth.testerId);
      byRowId.set(rowId, q);
    }

    await withTransaction(async (txQuery) => {
      await txQuery(`delete from quests where tester_id = $1`, [auth.testerId]);

      for (const [rowId, q] of byRowId) {
        await txQuery(
          `
          insert into quests (id, tester_id, data, status, created_at, updated_at)
          values ($1::uuid, $2::uuid, $3::jsonb, $4, $5, now())
          `,
          [
            rowId,
            auth.testerId,
            JSON.stringify(q),
            typeof q.status === "string" ? q.status : "available",
            typeof q.createdAt === "number" ? q.createdAt : Date.now(),
          ],
        );
      }
    });
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PUT /api/me/quests failed:", error);
    return errorJson("server_error", 500);
  }
}