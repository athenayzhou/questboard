import { NextResponse } from "next/server";
import { withTransaction } from "@/lib/db";
import { requireTesterId } from "@/lib/session";
import { errorJson } from "@/lib/apiResponses";
import { ensureSharedQuestsSchema } from "@/lib/sharedQuestsDb";

export async function GET(req: Request) {
  const auth = await requireTesterId(req);
  if(!auth.ok) return auth.response;

  try {
    const invites = await withTransaction(async (tx) => {
      await ensureSharedQuestsSchema(tx);

      const res = await tx(
        `
        select
          i.id,
          i.quest_id::text as quest_id,
          q.data->>'title' as quest_title,
          q.data as quest_data,
          m.display_name as inviter_name,
          i.created_at
        from shared_quest_invites i
        join shared_quest_quests q on q.id = i.quest_id
        join shared_quest_memberships m
          on m.quest_id = i.quest_id and m.tester_id = i.inviter_tester_id
        where i.invitee_tester_id = $1 and i.status = 'pending'
        order by i.created_at desc
        `,
        [auth.testerId],
      );

      return res.rows;
    });

    return NextResponse.json({ ok: true, invites });
  } catch (e) {
    console.error("GET /api/me/quest-invites failed:", e);
    return errorJson("server_error", 500);
  }
}