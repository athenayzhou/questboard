import { NextResponse } from "next/server";
import { requireTesterId } from "@/lib/session";
import { errorJson, parseJsonBody } from "@/lib/apiResponses";
import { withTransaction } from "@/lib/db";
import { ensureSharedBoardsSchema, emitBoardEvent } from "@/lib/sharedBoardsDb";
import { assignUserCodeIfMissing } from "@/lib/userCode";
import { z } from "zod";

type QuestRow = { id: string; data: unknown; status: string };

const pinSchema = z.object({ pinned: z.boolean() });

export async function POST(
  req: Request,
  ctx: { params: Promise<{ boardId: string; questId: string }> },
) {
  const auth = await requireTesterId(req);
  if (!auth.ok) return auth.response;
  const { boardId, questId } = await ctx.params;

  const parsedBody = await parseJsonBody(req);
  if (!parsedBody.ok) return parsedBody.response;
  const parsed = pinSchema.safeParse(parsedBody.data);
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

      let rowId = questId;
      let row: QuestRow | undefined;
      const byPkRes = await tx<QuestRow>(
        `select id::text as id, data, status
        from shared_board_quests
        where id = $1::uuid and board_id = $2::uuid
        limit 1`,
        [questId, boardId],
      );
      row = byPkRes.rows[0];

      if (!row) {
        // Backward-compatible lookup for rows whose data.id is the client-facing id.
        const byDataIdRes = await tx<QuestRow>(
          `select id::text as id, data, status
          from shared_board_quests
          where board_id = $2::uuid and (data->>'id') = $1
          limit 1`,
          [questId, boardId],
        );
        row = byDataIdRes.rows[0];
      }
      if (!row) return errorJson("not_found", 404);
      rowId = row.id;

      const q = (row.data && typeof row.data === "object" ? row.data : {}) as Record<
        string,
        unknown
      >;
      if (q["status"] !== "accepted" || row.status !== "accepted") {
        return NextResponse.json(
          { ok: false, error: "not_accepted" },
          { status: 409 },
        );
      }
      if (q["acceptedByUserId"] !== userCode) {
        return errorJson("unauthorized", 403);
      }

      const pins = {
        ...(((q as { sharedQuestPins?: unknown }).sharedQuestPins as Record<
          string,
          { pinned?: boolean; order?: number }
        > | null) ?? {}),
      };
      if (parsed.data.pinned) {
        const existingOrder =
          typeof pins[userCode]?.order === "number" ? pins[userCode].order : undefined;
        pins[userCode] = { pinned: true, order: existingOrder };
      } else {
        delete pins[userCode];
      }

      const updated = { ...(q as Record<string, unknown>), sharedQuestPins: pins };
      await tx(
        `update shared_board_quests set data = $3::jsonb, updated_at = now() where id = $1::uuid and board_id = $2::uuid`,
        [rowId, boardId, JSON.stringify(updated)],
      );

      const pinned = parsed.data.pinned;
      const questTitle =
        typeof q["title"] === "string" && q["title"].trim() ? q["title"].trim() : "quest";
      const questIdFromData =
        typeof q["id"] === "string" && q["id"].trim() ? q["id"].trim() : questId;

      await emitBoardEvent(tx, boardId, "quest_pinned", {
        questId: questIdFromData,
        pinned,
        pinnedByUserId: userCode,
        questTitle,
      });

      return NextResponse.json({ ok: true, quest: updated });
    });
  } catch (e) {
    console.error("POST /api/boards/:boardId/quests/:questId/pin failed:", e);
    return errorJson("server_error", 500);
  }
}

