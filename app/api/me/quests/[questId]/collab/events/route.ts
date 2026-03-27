import { NextResponse } from "next/server";
import { requireTesterId } from "@/lib/session";
import { query } from "@/lib/db";
import { ensureSharedQuestsSchema } from "@/lib/sharedQuestsDb";

type EventRow = {
  id: unknown;
  event_type: string;
  payload: unknown;
  created_at_ms: number;
};

export async function GET(
  req: Request,
  ctx: { params: Promise<{ questId: string }> },
) {
  const auth = await requireTesterId(req);
  if (!auth.ok) return auth.response;

  const { questId } = await ctx.params;
  const url = new URL(req.url);
  let cursor = parseInt(url.searchParams.get("cursor") || "0", 10);
  if (isNaN(cursor)) cursor = 0;

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      let heartbeat: ReturnType<typeof setInterval> | null = null;

      const cleanup = () => {
        if (closed) return;
        closed = true;
        if (heartbeat) clearInterval(heartbeat);
        try {
          controller.close();
        } catch {
          // ignore
        }
      };

      const safeEnqueue = (chunk: string): boolean => {
        if (closed) return false;
        try {
          controller.enqueue(chunk);
          return true;
        } catch {
          cleanup();
          return false;
        }
      };

      safeEnqueue(`retry: 5000\n\n`);

      heartbeat = setInterval(() => {
        if (closed) return;
        safeEnqueue(`event: heartbeat\ndata: {}\n\n`);
      }, 15000);

      try {
        await ensureSharedQuestsSchema(query);

        const mem = await query(
          `
          select 1
          from shared_quest_memberships
          where quest_id = $1::uuid and tester_id = $2::uuid and state = 'active'
          limit 1
          `,
          [questId, auth.testerId],
        );

        if ((mem.rows?.length ?? 0) === 0) {
          safeEnqueue(
            `event: error\ndata: ${JSON.stringify({ error: "unauthorized" })}\n\n`,
          );
          cleanup();
          return;
        }

        while (!closed) {
          const res = await query<EventRow>(
            `
            select
              id,
              event_type,
              payload,
              extract(epoch from created_at) * 1000 as created_at_ms
            from shared_quest_events
            where quest_id = $1::uuid and id > $2
            order by id asc
            limit 20
            `,
            [questId, cursor],
          );

          for (const row of res.rows) {
            if (
              !safeEnqueue(
                `event: quest-collab-event\ndata: ${JSON.stringify({
                  id: row.id,
                  type: row.event_type,
                  payload: row.payload ?? {},
                  ts: row.created_at_ms,
                })}\n\n`,
              )
            ) {
              break;
            }
            const nextCursor = typeof row.id === "number" ? row.id : Number(row.id);
            if (Number.isFinite(nextCursor)) cursor = nextCursor;
          }

          await new Promise((r) => setTimeout(r, 800));
        }
      } catch (e) {
        console.error(e);
        safeEnqueue(
          `event: error\ndata: ${JSON.stringify({ error: "server_error" })}\n\n`,
        );
      } finally {
        cleanup();
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
