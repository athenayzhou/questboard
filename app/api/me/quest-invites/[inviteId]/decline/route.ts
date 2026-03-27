import { NextResponse } from "next/server";
import { withTransaction } from "@/lib/db";
import { requireTesterId } from "@/lib/session";
import { errorJson } from "@/lib/apiResponses";
import { ensureSharedQuestsSchema } from "@/lib/sharedQuestsDb";

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
        invitee_tester_id: string;
      }>(
        `
        select invitee_tester_id::text as invitee_tester_id
        from shared_quest_invites
        where id = $1 and status = 'pending'
        `,
        [inviteId],
      );

      const invite = inviteRes.rows?.[0];
      if (!invite || invite.invitee_tester_id !== auth.testerId) {
        return errorJson("unauthorized", 403);
      }

      await tx(
        `update shared_quest_invites set status = 'declined' where id = $1`,
        [inviteId],
      );

      return NextResponse.json({ ok: true });
    });
  } catch (e) {
    console.error("POST decline quest invite failed:", e);
    return errorJson("server_error", 500);
  }
}
