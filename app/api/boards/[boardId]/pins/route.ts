import { NextResponse } from "next/server";
import { requireTesterId } from "@/lib/session";
import { errorJson, parseJsonBody } from "@/lib/apiResponses";
import { withTransaction } from "@/lib/db";
import { ensureSharedBoardsSchema } from "@/lib/sharedBoardsDb";
import { assignUserCodeIfMissing } from "@/lib/userCode";
import { z } from "zod";

type QuestRow = { id: string; data: unknown };

const reorderSchema = z.object({
  orderedQuestIds: z.array(z.string().min(1)).max(100),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ boardId: string }> },
) {
  const auth = await requireTesterId(req);
  if (!auth.ok) return auth.response;
  const { boardId } = await ctx.params;

  const parsedBody = await parseJsonBody(req);
  if (!parsedBody.ok) return parsedBody.response;
  const parsed = reorderSchema.safeParse(parsedBody.data);
  if (!parsed.success) return errorJson("invalid_payload", 400);

  try {
    return await withTransaction(async (tx) => {
      await ensureSharedBoardsSchema(tx);
      const userCode = await assignUserCodeIfMissing(auth.testerId);

      const memRes = await tx(
        `select 1 from shared_board_memberships where board_id = $1::uuid and tester_id = $2::uuid limit 1`,
        [boardId, auth.testerId],
      );
      if ((memRes.rows?.length ?? 0) === 0) return errorJson("unauthorized", 403);

      const ids = parsed.data.orderedQuestIds;
      if (ids.length === 0) return NextResponse.json({ ok: true, quests: [] });

      const rowsRes = await tx<QuestRow>(
        `
        select id::text as id, data
        from shared_board_quests
        where board_id = $1::uuid and id = any($2::uuid[])
        `,
        [boardId, ids],
      );

      const byId = new Map<string, Record<string, unknown>>(
        rowsRes.rows.map((r) => [
          r.id,
          (r.data && typeof r.data === "object" ? (r.data as Record<string, unknown>) : {}),
        ]),
      );

      const updatedQuests: Record<string, unknown>[] = [];
      for (let i = 0; i < ids.length; i++) {
        const id = ids[i];
        const q = byId.get(id);
        if (!q) continue;
        if (q["status"] !== "accepted") continue;
        if (q["acceptedByUserId"] !== userCode) continue;
        const pins = (q["sharedQuestPins"] ?? {}) as Record<
          string,
          { pinned?: boolean; order?: number }
        >;
        if (pins[userCode]?.pinned !== true) continue;

        const nextPins = { ...pins, [userCode]: { pinned: true, order: i } };
        const updated = { ...q, sharedQuestPins: nextPins };
        updatedQuests.push(updated);
      }

      // Persist updates
      for (const q of updatedQuests) {
        await tx(
          `update shared_board_quests set data = $3::jsonb, updated_at = now() where id = $1::uuid and board_id = $2::uuid`,
          [String(q["id"]), boardId, JSON.stringify(q)],
        );
      }

      return NextResponse.json({ ok: true, quests: updatedQuests });
    });
  } catch (e) {
    console.error("POST /api/boards/:boardId/pins failed:", e);
    return errorJson("server_error", 500);
  }
}

