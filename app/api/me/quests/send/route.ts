import { NextResponse } from "next/server";
import { withTransaction } from "@/lib/db";
import { requireTesterId } from "@/lib/session";
import { errorJson, parseJsonBody } from "@/lib/apiResponses";
import { questRowIdFromClientId } from "@/lib/questRowId";
import { z } from "zod";
import type { Quest } from "@/types/quest";
import { normalizeUserCodeInput } from "@/utils/format/code";
import { consumeRateLimit, requestIp } from "@/lib/rateLimit";

const questSchema = z.object({}).passthrough();
const MAX_NOTE_LEN = 500;
const MAX_SENT_QUEST_BYTES = 64_000;

const payloadSchema = z.object({
  toUserCode: z.string().max(64),
  quest: questSchema,
  note: z.string().max(MAX_NOTE_LEN).nullish(),
});

type RecipientRow = {
  tester_id: string;
  player_code: string;
};

type SenderRow = {
  player_code: string;
  display_name: string | null;
};

export async function POST(req: Request) {
  try {
    const auth = await requireTesterId(req);
    if (!auth.ok) return auth.response;

    const parsedBody = await parseJsonBody(req);
    if (!parsedBody.ok) return parsedBody.response;

    const parsed = payloadSchema.safeParse(parsedBody.data);
    if (!parsed.success) return errorJson("invalid_payload", 400);

    const toUserCode = normalizeUserCodeInput(parsed.data.toUserCode);
    if (!toUserCode) return errorJson("invalid_code", 400);

    const note = parsed.data.note?.trim() || null;
    const rawQuest = parsed.data.quest as Quest;
    if (!rawQuest?.title || typeof rawQuest.title !== "string") {
      return errorJson("invalid_quest", 400);
    }
    if (rawQuest.title.length > 200) return errorJson("invalid_quest", 400);
    if ((rawQuest.description?.length ?? 0) > 5_000) {
      return errorJson("invalid_quest", 400);
    }
    if ((rawQuest.subquests?.length ?? 0) > 100) {
      return errorJson("invalid_quest", 400);
    }

    const rate = consumeRateLimit({
      key: `send-quest:${auth.testerId}:${requestIp(req)}`,
      limit: 20,
      windowMs: 60_000,
    });
    if (!rate.allowed){
      return NextResponse.json(
        { ok: false, error: "rate_limited", retryAfterSec: rate.retryAfterSec },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSec) } },
      );
    }
    const now = Date.now();

    const result = await withTransaction(async (tx) => {
      const recipientRes = await tx<RecipientRow>(
        `
        select id as tester_id, player_code
        from testers
        where player_code = $1
        limit 1
        `,
        [toUserCode],
      );

      const recipient = recipientRes.rows[0];
      if (!recipient) return { ok: false as const, error: "not_found" as const };
      if (recipient.tester_id === auth.testerId) return { ok: false as const, error: "self" as const };

      const senderRes = await tx<SenderRow>(
        `
        select
          t.player_code,
          ps.data->'profile'->>'name' as display_name
        from testers t
        left join player_states ps on ps.tester_id = t.id
        where t.id = $1
        limit 1
        `,
        [auth.testerId],
      );
      const sender = senderRes.rows[0];
      const senderCode = sender?.player_code ?? null;
      const senderName = sender?.display_name?.trim() || null;
      const duplicateWindowStart = Date.now() - 10 * 60 * 1000;

      const recent = await tx(
        `select 1 from quests
        where tester_id = $1
          and (data->>'sourceQuestId') = $2
          and (data->>'sentByUserId') = $3
          and (data->>'sentAt')::bigint > $4
        limit 1`,
        [recipient.tester_id, rawQuest.id, senderCode, duplicateWindowStart],
      );
      if (recent.rows.length > 0) {
        return { ok: false as const, error: "duplicate_send" as const };
      }

      const newQuest: Quest = {
        ...rawQuest,
        id: crypto.randomUUID(),
        status: "available",
        createdAt: now,
        acceptedAt: undefined,
        completedAt: undefined,
        pinned: undefined,
        order: undefined,
        x: undefined,
        y: undefined,
        zIndex: undefined,
        boardId: null,
        acceptedByUserId: null,
        completedByUserId: null,
        sharedQuestPins: undefined,
        sentByUserId: senderCode,
        sentByName: senderName,
        sentNote: note,
        sentAt: now,
        sourceQuestId: rawQuest.id,
      };
      if (JSON.stringify(newQuest).length > MAX_SENT_QUEST_BYTES) {
        return { ok: false as const, error: "invalid_quest" as const };
      }

      const rowId = questRowIdFromClientId(newQuest.id, recipient.tester_id);

      await tx(
        `
        insert into quests (id, tester_id, data, status, created_at, updated_at)
        values ($1::uuid, $2::uuid, $3::jsonb, $4, $5, now())
        on conflict (id) do update
          set data = excluded.data,
              status = excluded.status,
              updated_at = now()
        `,
        [rowId, recipient.tester_id, JSON.stringify(newQuest), newQuest.status, newQuest.createdAt],
      );

      return { ok: true as const, quest: newQuest };
    });

    if (!result.ok) {
      if (result.error === "not_found") return errorJson("not_found", 404);
      if (result.error === "self") return errorJson("self", 400);
      if (result.error === "duplicate_send") return errorJson("duplicate_send", 409);
      if (result.error === "invalid_quest") return errorJson("invalid_quest", 400);
      return errorJson("server_error", 500);
    }

    return NextResponse.json({ ok: true, quest: result.quest });
  } catch (error) {
    console.error("POST /api/me/quests/send failed:", error);
    return errorJson("server_error", 500);
  }
}

