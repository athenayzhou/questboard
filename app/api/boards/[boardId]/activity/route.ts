import { NextResponse } from "next/server";
import { requireTesterId } from "@/lib/session";
import { query } from "@/lib/db";
import { ensureSharedBoardsSchema } from "@/lib/sharedBoardsDb";
import { errorJson } from "@/lib/apiResponses";

type EventRow = {
  id: unknown;
  board_id: string;
  event_type: string;
  payload: unknown;
  created_at_ms: number;
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ boardId: string }> },
) {
  const auth = await requireTesterId(req);
  if(!auth.ok) return auth.response;

  const { boardId } = await ctx.params;
  const url = new URL(req.url);

  const rawBefore = url.searchParams.get("beforeId");
  const parsedBefore = rawBefore ? Number(rawBefore) : null;
  const beforeId = Number.isFinite(parsedBefore) && parsedBefore! > 0 ? parsedBefore : null;

  const rawLimit = Number(url.searchParams.get("limit") || 30);
  const limit = Math.max(1, Math.min(100, Number.isFinite(rawLimit) ? rawLimit: 30));

  try {
    await ensureSharedBoardsSchema(query);

    const mem = await query(
      `select 1
      from shared_board_memberships
      where board_id = $1::uuid and tester_id = $2::uuid
      limit 1`,
      [boardId, auth.testerId],
    );
    if((mem.rows?.length ?? 0) === 0) return errorJson("unauthorized", 403);

    const res = await query<EventRow>(
      `
      select
        id,
        board_id::text,
        event_type,
        payload,
        extract(epoch from created_at) * 1000 as created_at_ms
      from shared_board_events
      where board_id = $1::uuid
        and ($2::bigint is null or id < $2::bigint)
      order by id desc
      limit $3
      `,
      [boardId, beforeId, limit],
    );

    const events = res.rows.map((r) => ({
      id: typeof r.id === "number" ? r.id : Number(r.id),
      boardId: r.board_id,
      type: r.event_type,
      payload: (r.payload ?? {}) as Record<string, unknown>,
      createdAt: Number(r.created_at_ms),
    }));

    // Filter out any unexpected NaN ids (shouldn't happen, but keeps response safe).
    const cleaned = events.filter((e) => Number.isFinite(e.id));

    return NextResponse.json({
      ok: true,
      events: cleaned,
      nextBeforeId: cleaned.length > 0 ? cleaned[cleaned.length - 1].id : null,
    });
  } catch (e) {
    console.error("GET /api/boards/:boardId/activity failed:", e);
    return errorJson("server_error", 500);
  }
}