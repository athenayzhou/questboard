import { NextResponse } from "next/server";
import { withTransaction } from "@/lib/db";
import { requireTesterId } from "@/lib/session";
import { errorJson } from "@/lib/apiResponses";
import { ensureSharedQuestsSchema, emitQuestCollabEvent } from "@/lib/sharedQuestsDb";
import { assignUserCodeIfMissing } from "@/lib/userCode";

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
      if(!membership) return errorJson("unauthorized", 403);
      if(membership.state === "left") return NextResponse.json({ ok: true });

      await tx(
        `
        update shared_quest_memberships
        set state = 'left'
        where quest_id = $1::uuid and tester_id = $2::uuid
        `,
        [questId, auth.testerId],
      );

      const activeRes = await tx<{ n: string }>(
        `
        select count(*)::text as n
        from shared_quest_memberships
        where quest_id = $1::uuid and state = 'active'
        `,
        [questId],
      );
      const activeCount = Number(activeRes.rows?.[0]?.n ?? "0");

      const nowMs = Date.now();
      if (activeCount === 0) {
        await tx(
          `
          update shared_quest_quests
          set
            status = 'failed',
            data = jsonb_set(
              jsonb_set(
                jsonb_set(
                  coalesce(data, '{}'::jsonb),
                  '{status}',
                  '"failed"'::jsonb,
                  true
                ),
                '{failedAt}',
                to_jsonb($2::bigint),
                true
              ),
              '{completedAt}',
              to_jsonb($2::bigint),
              true
            ),
            updated_at = now()
          where id = $1::uuid
          `,
          [questId, nowMs],
        );
      }

      await emitQuestCollabEvent(tx, questId, "collab_member_left", {
        questId,
        leftByUserId: userCode,
        allMembersLeft: activeCount === 0,
      });

      return NextResponse.json({ ok: true });
    });
  } catch (e) {
    console.error("POST collab give-up failed:", e);
    return errorJson("server_error", 500);
  }
}