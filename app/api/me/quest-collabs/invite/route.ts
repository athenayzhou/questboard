import { NextResponse } from "next/server";
import { z } from "zod";
import { withTransaction } from "@/lib/db";
import { requireTesterId } from "@/lib/session";
import { errorJson, parseJsonBody } from "@/lib/apiResponses";
import { ensureSharedQuestsSchema, emitQuestCollabEvent } from "@/lib/sharedQuestsDb";
import { assignUserCodeIfMissing, normalizeUserCodeInput } from "@/lib/userCode";
import { questRowIdFromClientId } from "@/lib/questRowId";

const inviteSchema = z.object({
  questId: z.string().min(1),
  toUserCode: z.string().min(1),
});

export async function POST(req: Request) {
  const auth = await requireTesterId(req);
  if (!auth.ok) return auth.response;

  const parsedBody = await parseJsonBody(req);
  if (!parsedBody.ok) return parsedBody.response;

  const parsed = inviteSchema.safeParse(parsedBody.data);
  if (!parsed.success) return errorJson("invalid_payload", 400);

  const { questId, toUserCode } = parsed.data;
  const wantedCode = normalizeUserCodeInput(toUserCode);
  if (!wantedCode) return errorJson("invalid_code", 400);

  try {
    return await withTransaction(async (tx) => {
      await ensureSharedQuestsSchema(tx);

      const targetRes = await tx<{ id: string }>(
        `select id::text as id from testers where user_code = $1 limit 1`,
        [wantedCode],
      );

      const targetTesterId = targetRes.rows?.[0]?.id;
      if (!targetTesterId) return errorJson("not_found", 404);
      if (targetTesterId === auth.testerId) return errorJson("self", 400);

      const rowId = questRowIdFromClientId(questId, auth.testerId);
      const personalRes = await tx<{ data: unknown; status: string }>(
        `select data, status from quests where id = $1::uuid and tester_id = $2 limit 1`,
        [rowId, auth.testerId],
      );
      const personalRow = personalRes.rows?.[0];
      if (!personalRow) return errorJson("not_found", 404);

      const inviterUserCode = await assignUserCodeIfMissing(auth.testerId);

      const nameRes = await tx<{ data: unknown }>(
        `select data from user_states where user_id = $1 limit 1`,
        [auth.testerId],
      );
      const raw = nameRes.rows?.[0]?.data;
      const inviterDisplayName =
        raw && typeof raw === "object" && "profile" in raw
          ? String((raw as { profile?: { name?: unknown } }).profile?.name ?? "")
          : "";
      const safeInviterDisplayName =
        inviterDisplayName.trim() || `user-${inviterUserCode.slice(0, 6)}`;

      const collabQuestId = crypto.randomUUID();
      const now = Date.now();

      const baseQuest = (personalRow.data && typeof personalRow.data === "object"
        ? personalRow.data
        : {}) as Record<string, unknown>;

      const collabQuestData: Record<string, unknown> = {
        ...baseQuest,
        id: collabQuestId,
        collabQuest: true,
        status: "accepted",
        acceptedAt: now,
        acceptedByUserId: inviterUserCode,
        completedAt: null,
        boardId: null,
      };

      await tx(
        `
        insert into shared_quest_quests (id, data, status, created_at, updated_at)
        values ($1::uuid, $2::jsonb, $3, $4, now())
        `,
        [collabQuestId, JSON.stringify(collabQuestData), "accepted", now],
      );

      await tx(
        `
        insert into shared_quest_memberships
        (quest_id, tester_id, user_code, display_name, role, state)
        values ($1::uuid, $2::uuid, $3, $4, 'admin', 'active')
        on conflict (quest_id, tester_id) do nothing
        `,
        [collabQuestId, auth.testerId, inviterUserCode, safeInviterDisplayName],
      );

      const inviteIdRes = await tx<{ id: string }>(
        `
        with up as (
          update shared_quest_invites
          set
            inviter_tester_id = $2::uuid,
            status = 'pending',
            created_at = now()
          where quest_id = $1::uuid and invitee_tester_id = $3::uuid
          returning id::text
        )
        select id::text as id from up
        `,
        [collabQuestId, auth.testerId, targetTesterId],
      );

      let inviteId: string;
      if (inviteIdRes.rows?.[0]?.id) {
        inviteId = inviteIdRes.rows[0].id;
      } else {
        const inserted = await tx<{ id: string }>(
          `
          insert into shared_quest_invites (quest_id, inviter_tester_id, invitee_tester_id, status)
          values ($1::uuid, $2::uuid, $3::uuid, 'pending')
          on conflict (quest_id, invitee_tester_id) do update
            set inviter_tester_id = excluded.inviter_tester_id,
              status = 'pending',
              created_at = now()
          returning id::text as id
          `,
          [collabQuestId, auth.testerId, targetTesterId],
        );
        inviteId = inserted.rows?.[0]?.id!;
      }

      await emitQuestCollabEvent(tx, collabQuestId, "collab_invited", {
        questId: collabQuestId,
        invitedByUserId: inviterUserCode,
      });

      return NextResponse.json({
        ok: true,
        inviteId,
        quest: collabQuestData,
      });
    });
  } catch (e) {
    console.error("POST /api/me/quest-collabs/invite failed:", e);
    return errorJson("server_error", 500);
  }
}
