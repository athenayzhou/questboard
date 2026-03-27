import { NextResponse } from "next/server";
import { withTransaction } from "@/lib/db";
import { requireTesterId } from "@/lib/session";
import { errorJson } from "@/lib/apiResponses";
import { ensureSharedQuestsSchema, emitQuestCollabEvent } from "@/lib/sharedQuestsDb";
import { assignUserCodeIfMissing } from "@/lib/userCode";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ inviteId: string }> },
) {
  const auth = await requireTesterId(req);
  if (!auth.ok) return auth.response;

  const { inviteId } = await ctx.params;

  try {
    return await withTransaction(async (tx) => {
      await ensureSharedQuestsSchema(tx);

      const inviteRes = await tx<{
        quest_id: string;
        invitee_tester_id: string;
      }>(
        `
        select quest_id::text as quest_id, invitee_tester_id::text as invitee_tester_id
        from shared_quest_invites
        where id = $1 and status = 'pending'
        `,
        [inviteId],
      );

      const invite = inviteRes.rows?.[0];
      if (!invite || invite.invitee_tester_id !== auth.testerId) {
        return errorJson("unauthorized", 403);
      }

      const userCode = await assignUserCodeIfMissing(auth.testerId);

      const psRes = await tx<{ data: unknown }>(
        `select data from user_states where user_id = $1 limit 1`,
        [auth.testerId],
      );
      const raw = psRes.rows?.[0]?.data;
      const displayName =
        raw && typeof raw === "object" && "profile" in raw
          ? String(
              (raw as { profile?: { name?: unknown } }).profile?.name ??
                `user-${userCode.slice(0, 6)}`,
            )
          : `user-${userCode.slice(0, 6)}`;

      await tx(
        `update shared_quest_invites set status = 'accepted' where id = $1`,
        [inviteId],
      );

      await tx(
        `
        insert into shared_quest_memberships
        (quest_id, tester_id, user_code, display_name, role, state)
        values ($1::uuid, $2::uuid, $3, $4, 'member', 'active')
        on conflict (quest_id, tester_id) do update
          set state = 'active',
              user_code = excluded.user_code,
              display_name = excluded.display_name
        `,
        [invite.quest_id, auth.testerId, userCode, displayName],
      );

      const safeName = displayName.trim() || `user-${userCode.slice(0, 6)}`;
      await emitQuestCollabEvent(tx, invite.quest_id, "collab_invite_accepted", {
        questId: invite.quest_id,
        accepterDisplayName: safeName,
        accepterUserCode: userCode,
      });

      return NextResponse.json({ ok: true });
    });
  } catch (e) {
    console.error("POST accept quest invite failed:", e);
    return errorJson("server_error", 500);
  }
}
