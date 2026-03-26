import { NextResponse } from "next/server";
import { requireTesterId } from "@/lib/session";
import { errorJson } from "@/lib/apiResponses";
import { withTransaction } from "@/lib/db";
import { ensureSharedBoardsSchema } from "@/lib/sharedBoardsDb";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ inviteId: string }> }
){
  const auth = await requireTesterId(req);
  if(!auth.ok) return auth.response;
  const { inviteId } = await ctx.params;

  try {
    const result = await withTransaction(async (tx) => {
      await ensureSharedBoardsSchema(tx);

      const inviteRes = await tx(
        `select board_id, invitee_tester_id from shared_board_invites
        where id = $1 and status = 'pending'`,
        [inviteId]
      );
      const invite = inviteRes.rows[0];
      if(!invite || invite.invitee_tester_id !== auth.testerId) {
        return errorJson("unauthorized", 403);
      }

      await tx(
        `update shared_board_invites set status = 'declined' where id = $1`,
        [inviteId]
      );
      return NextResponse.json({ ok: true });
    });

    return result;
  } catch (e) {
    console.error("POST decline invite failed:", e);
    return errorJson("server_error", 500);
  }
}