import { NextResponse } from "next/server";
import { requireTesterId } from "@/lib/session";
import { errorJson } from "@/lib/apiResponses";
import { withTransaction } from "@/lib/db";
import { ensureSharedBoardsSchema } from "@/lib/sharedBoardsDb";
import { assignUserCodeIfMissing } from "@/lib/userCode";

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
      const userCode = await assignUserCodeIfMissing(auth.testerId);

      const inviteRes = await tx(
        `select board_id, invitee_tester_id from shared_board_invites
        where id = $1 and status = 'pending'`,
        [inviteId]
      );
      const invite = inviteRes.rows[0];
      if(!invite || invite.invitee_tester_id !== auth.testerId) {
        return errorJson("unauthorized", 403);
      }

      const psRes = await tx<{ data: unknown }>(
        `select data from player_states where tester_id = $1::uuid limit 1`,
        [auth.testerId],
      );
      const raw = psRes.rows?.[0]?.data;
      const displayName =
        raw && typeof raw === "object" && "profile" in raw
          ? String(
              (raw as { profile?: { name?: unknown } }).profile?.name ??
                `player-${userCode.slice(0, 6)}`,
            )
          : `player-${userCode.slice(0, 6)}`;

      await tx(
        `update shared_board_invites set status = 'accepted' where id = $1`,
        [inviteId]
      );

      await tx(
        `insert into shared_board_memberships
        (board_id, tester_id, user_code, display_name, role)
        values ($1, $2, $3, $4, 'member')
        on conflict (board_id, tester_id) do nothing`,
        [invite.board_id, auth.testerId, userCode, displayName]
      );
      return NextResponse.json({ ok: true });
    });

    return result;
  } catch (e) {
    console.error("POST accept invite failed:", e);
    return errorJson("server_error", 500);
  }
}