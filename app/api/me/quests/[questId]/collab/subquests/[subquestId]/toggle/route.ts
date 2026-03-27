import { NextResponse } from "next/server";
import { z } from "zod";
import { withTransaction } from "@/lib/db";
import { requireTesterId } from "@/lib/session";
import { errorJson, parseJsonBody } from "@/lib/apiResponses";
import { ensureSharedQuestsSchema, emitQuestCollabEvent } from "@/lib/sharedQuestsDb";
import { assignUserCodeIfMissing } from "@/lib/userCode";

const bodySchema = z.object({
  completed: z.boolean(),
});

type QuestRow = { data: unknown; status: string };

export async function POST(
  req: Request,
  ctx: { params: Promise<{ questId: string; subquestId: string }> },
){
  const auth = await requireTesterId(req);
  if(!auth.ok) return auth.response;

  const { questId, subquestId } = await ctx.params;

  const parsedBody = await parseJsonBody(req);
  if(!parsedBody.ok) return parsedBody.response;

  const parsed = bodySchema.safeParse(parsedBody.data);
  if(!parsed.success) return errorJson("invalid_payload", 400);

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
      if(!membership || membership.state !== "active"){
        return errorJson("unauthorized", 403);
      }

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
      if(!row) return errorJson("not_found", 404);

      if(row.status === "completed" || row.status === "failed"){
        return NextResponse.json({ ok: false, error: "not_editable" }, { status: 409 });
      }

      const q = (row.data && typeof row.data === "object" ? row.data : {}) as Record<
        string,
        unknown
      >;

      const subquests = Array.isArray(q.subquests) ? (q.subquests as any[]) : [];
      const nextSubquests = subquests.map((sq) => {
        if(String(sq.id) !== subquestId) return sq;
        return { ...sq, completed: parsed.data.completed };
      });

      const updated = {
        ...q,
        subquests: nextSubquests,
        updatedAt: Date.now(),
      };

      await tx(
        `
        update shared_quest_quests
        set data = $2::jsonb, updated_at = now()
        where id = $1::uuid
        `,
        [questId, JSON.stringify(updated)],
      );

      await emitQuestCollabEvent(tx, questId, "quest_subquest_toggled", {
        questId,
        subquestId,
        completed: parsed.data.completed,
        toggledByUserId: userCode,
      });

      return NextResponse.json({ ok: true, quest: updated });
    });
  } catch (e) {
    console.error("POST toggle subquest collab failed:", e);
    return errorJson("server_error", 500);
  }
}