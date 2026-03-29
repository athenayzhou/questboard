import { NextResponse } from "next/server";
import { withTransaction } from "@/lib/db";
import { requireTesterId } from "@/lib/session";
import { errorJson } from "@/lib/apiResponses";
import { ensureFriendEdgesSchema } from "@/lib/friendsDb";
import { ensureBoardLayoutSchema } from "@/lib/boardLayoutDb";
import { ensureSharedBoardsSchema } from "@/lib/sharedBoardsDb";
import { ensureSharedQuestsSchema } from "@/lib/sharedQuestsDb";

/**
 * Server-side reset hooks used by Settings > reset data.
 * Removes friend edges, shared-board and quest-collab participation, saved board layouts,
 * and empty boards / collab quests left with no members.
 */
export async function POST(req: Request) {
  const auth = await requireTesterId(req);
  if (!auth.ok) return auth.response;

  try {
    await withTransaction(async (tx) => {
      await ensureFriendEdgesSchema(tx);
      await ensureBoardLayoutSchema(tx);
      await ensureSharedBoardsSchema(tx);
      await ensureSharedQuestsSchema(tx);

      await tx(
        `
        delete from shared_board_invites
        where inviter_tester_id = $1::uuid or invitee_tester_id = $1::uuid
        `,
        [auth.testerId],
      );
      await tx(
        `delete from shared_board_memberships where tester_id = $1::uuid`,
        [auth.testerId],
      );
      await tx(
        `
        delete from shared_boards b
        where not exists (
          select 1 from shared_board_memberships m where m.board_id = b.id
        )
        `,
      );

      await tx(
        `
        delete from shared_quest_invites
        where inviter_tester_id = $1::uuid or invitee_tester_id = $1::uuid
        `,
        [auth.testerId],
      );
      await tx(
        `delete from shared_quest_memberships where tester_id = $1::uuid`,
        [auth.testerId],
      );
      await tx(
        `
        delete from shared_quest_quests q
        where not exists (
          select 1 from shared_quest_memberships m where m.quest_id = q.id
        )
        `,
      );

      await tx(
        `
        delete from friend_edges
        where tester_low = $1::uuid or tester_high = $1::uuid
        `,
        [auth.testerId],
      );
      await tx(`delete from quest_board_layouts where tester_id = $1::uuid`, [
        auth.testerId,
      ]);
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/me/reset-data failed:", error);
    return errorJson("server_error", 500);
  }
}
