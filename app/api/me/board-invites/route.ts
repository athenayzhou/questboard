import { NextResponse } from "next/server";
import { requireTesterId } from "@/lib/session";
import { errorJson } from "@/lib/apiResponses";
import { withTransaction } from "@/lib/db";
import { ensureSharedBoardsSchema } from "@/lib/sharedBoardsDb";

export async function GET(req: Request){
  const auth = await requireTesterId(req);
  if(!auth.ok) return auth.response;

  try{
    const invites = await withTransaction(async (tx) => {
      await ensureSharedBoardsSchema(tx);
      const res = await tx(
        `
        select
          i.id,
          b.name as board_name,
          s.display_name as inviter_name,
          i.created_at
        from shared_board_invites i
        join shared_boards b on b.id = i.board_id
        join shared_board_memberships s on s.tester_id = i.inviter_tester_id
          and s.board_id = i.board_id
        where i.invitee_tester_id = $1 and i.status = 'pending'
        order by i.created_at desc
        `,
        [auth.testerId]
      );
      return res.rows;
    });

    return NextResponse.json({ ok: true, invites });
  } catch (e) {
    console.error("GET /api/me/board-invites failed:", e);
    return errorJson("server_error", 500);
  }
}