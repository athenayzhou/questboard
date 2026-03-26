import { NextResponse } from "next/server";
import { requireTesterId } from "@/lib/session";
import { errorJson } from "@/lib/apiResponses";
import { withTransaction } from "@/lib/db";
import { ensureSharedBoardsSchema } from "@/lib/sharedBoardsDb";
import { assignUserCodeIfMissing } from "@/lib/userCode";

type QuestRow = { data: unknown; status: string };

export async function POST(
  req: Request,
  ctx: { params: Promise<{ boardId: string; questId: string }> },
) {
  const auth = await requireTesterId(req);
  if (!auth.ok) return auth.response;
  const { boardId, questId } = await ctx.params;

  try {
    return await withTransaction(async (tx) => {
      await ensureSharedBoardsSchema(tx);
      const userCode = await assignUserCodeIfMissing(auth.testerId);

      const memRes = await tx(
        `select 1 from shared_board_memberships where board_id = $1::uuid and tester_id = $2::uuid limit 1`,
        [boardId, auth.testerId],
      );
      if ((memRes.rows?.length ?? 0) === 0) return errorJson("unauthorized", 403);

      const res = await tx<QuestRow>(
        `select data, status from shared_board_quests where id = $1::uuid and board_id = $2::uuid limit 1`,
        [questId, boardId],
      );
      const row = res.rows[0];
      if (!row) return errorJson("not_found", 404);

      const q = (row.data && typeof row.data === "object" ? row.data : {}) as Record<
        string,
        unknown
      >;
      if (q["status"] !== "available" || row.status !== "available") {
        return NextResponse.json(
          { ok: false, error: "not_available" },
          { status: 409 },
        );
      }
      if (typeof q["acceptedByUserId"] === "string" && q["acceptedByUserId"]) {
        return NextResponse.json(
          { ok: false, error: "already_accepted" },
          { status: 409 },
        );
      }

      const updated = {
        ...(q as Record<string, unknown>),
        status: "accepted",
        acceptedAt: Date.now(),
        acceptedByUserId: userCode,
      };

      await tx(
        `update shared_board_quests set data = $3::jsonb, status = $4, updated_at = now() where id = $1::uuid and board_id = $2::uuid`,
        [questId, boardId, JSON.stringify(updated), "accepted"],
      );

      return NextResponse.json({ ok: true, quest: updated });
    });
  } catch (e) {
    console.error("POST /api/boards/:boardId/quests/:questId/accept failed:", e);
    return errorJson("server_error", 500);
  }
}

