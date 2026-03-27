import { NextResponse } from "next/server";
import { withTransaction } from "@/lib/db";
import { requireTesterId } from "@/lib/session";
import { errorJson } from "@/lib/apiResponses";
import { ensureSharedQuestsSchema, emitQuestCollabEvent } from "@/lib/sharedQuestsDb";
import { assignUserCodeIfMissing } from "@/lib/userCode";

type QuestRow = { data: unknown; status: string };

export async function POST(
  req: Request,
  ctx: { params: Promise<{ questId: string }> },
) {
  const auth = await requireTesterId(req);
  if (!auth.ok) return auth.response;
  const { questId } = await ctx.params;
  try {
    return await withTransaction(async (tx) => {
      await ensureSharedQuestsSchema(tx);
      const userCode = await assignUserCodeIfMissing(auth.testerId);
      const memRes = await tx<{ state: string }>(
        `
        select state
        from shared_quest_memberships
        where quest_id = $1::uuid and tester_id = $2::uuid limit 1
        `,
        [questId, auth.testerId],
      );
      const membership = memRes.rows?.[0];
      if (!membership || membership.state !== "active") return errorJson("unauthorized", 403);

      const questRes = await tx<QuestRow>(
        `
        select data, status
        from shared_quest_quests
        where id = $1::uuid
        limit 1
        `,
        [questId],
      );
      const row = questRes.rows?.[0];
      if (!row) return errorJson("not_found", 404);

      if (row.status === "completed") return NextResponse.json({ ok: true });
      if (row.status === "failed") {
        return NextResponse.json({ ok: false, error: "already_failed" }, { status: 409 });
      }

      const q = (row.data && typeof row.data === "object" ? row.data : {}) as Record<string, unknown>;
      const now = Date.now();

      const updated = {
        ...q,
        status: "completed",
        completedAt: now,
        completedByUserId: userCode,
      };

      await tx(
        `
        update shared_quest_quests
        set
          data = $2::jsonb,
          status = 'completed',
          updated_at = now()
        where id = $1::uuid
        `,
        [questId, JSON.stringify(updated)],
      );

      await emitQuestCollabEvent(tx, questId, "quest_completed", {
        questId,
        completedByUserId: userCode,
      });

      return NextResponse.json({ ok: true, quest: updated });
    });
  } catch (e) {
    console.error("POST collab complete failed:", e);
    return errorJson("server_error", 500);
  }
}
