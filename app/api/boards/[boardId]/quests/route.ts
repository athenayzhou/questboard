import { NextResponse } from "next/server";
import { requireTesterId } from "@/lib/session";
import { errorJson, parseJsonBody } from "@/lib/apiResponses";
import { withTransaction } from "@/lib/db";
import { ensureSharedBoardsSchema } from "@/lib/sharedBoardsDb";
import { assignUserCodeIfMissing } from "@/lib/userCode";
import { emitBoardEvent } from "@/lib/sharedBoardsDb";
import { z } from "zod";

type JsonRow = { data: unknown };

const questSchema = z.object({}).passthrough();
const createQuestSchema = z.object({ quest: questSchema });

async function requireBoardMember(
  tx: (text: string, params?: unknown[]) => Promise<{ rows: unknown[] }>,
  boardId: string,
  testerId: string,
): Promise<{ ok: true; userCode: string } | { ok: false; response: NextResponse }> {
  const userCode = await assignUserCodeIfMissing(testerId);
  const memRes = await tx(
    `select 1 from shared_board_memberships where board_id = $1::uuid and tester_id = $2::uuid limit 1`,
    [boardId, testerId],
  );
  if ((memRes.rows?.length ?? 0) === 0) {
    return { ok: false, response: errorJson("unauthorized", 403) };
  }
  return { ok: true, userCode };
}

export async function GET(req: Request, ctx: { params: Promise<{ boardId: string }> }) {
  const auth = await requireTesterId(req);
  if (!auth.ok) return auth.response;
  const { boardId } = await ctx.params;

  try {
    const quests = await withTransaction(async (tx) => {
      await ensureSharedBoardsSchema(tx);
      const mem = await requireBoardMember(tx, boardId, auth.testerId);
      if (!mem.ok) return mem.response;

      const res = await tx<JsonRow>(
        `select data from shared_board_quests where board_id = $1::uuid order by created_at desc`,
        [boardId],
      );
      return NextResponse.json({ ok: true, quests: res.rows.map((r) => r.data) });
    });
    return quests;
  } catch (e) {
    console.error("GET /api/boards/:boardId/quests failed:", e);
    return errorJson("server_error", 500);
  }
}

export async function POST(req: Request, ctx: { params: Promise<{ boardId: string }> }) {
  const auth = await requireTesterId(req);
  if (!auth.ok) return auth.response;
  const { boardId } = await ctx.params;

  const parsedBody = await parseJsonBody(req);
  if (!parsedBody.ok) return parsedBody.response;
  const parsed = createQuestSchema.safeParse(parsedBody.data);
  if (!parsed.success) return errorJson("invalid_payload", 400);

  try {
    const quest = await withTransaction(async (tx) => {
      await ensureSharedBoardsSchema(tx);
      const mem = await requireBoardMember(tx, boardId, auth.testerId);
      if (!mem.ok) return mem.response;

      const id = crypto.randomUUID();
      const now = Date.now();
      const data = {
        ...parsed.data.quest,
        id,
        boardId,
        status: "available",
        createdAt: now,
      };

      const questTitleRaw = (data as Record<string, unknown>).title;
      const questTitle =
        typeof questTitleRaw === "string" && questTitleRaw.trim()
          ? questTitleRaw.trim()
          : "quest";

      await tx(
        `
        insert into shared_board_quests (id, board_id, data, status, created_at, updated_at)
        values ($1::uuid, $2::uuid, $3::jsonb, $4, $5, now())
        `,
        [id, boardId, JSON.stringify(data), "available", now],
      );
      await emitBoardEvent(tx, boardId, "quest_created", {
        questId: id,
        createdBy: mem.userCode,
        questTitle,
      });
      return NextResponse.json({ ok: true, quest: data });
    });
    return quest;
  } catch (e) {
    console.error("POST /api/boards/:boardId/quests failed:", e);
    return errorJson("server_error", 500);
  }
}