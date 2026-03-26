import { NextResponse } from "next/server";
import { requireTesterId } from "@/lib/session";
import { query } from "@/lib/db";
import { ensureSharedBoardsSchema } from "@/lib/sharedBoardsDb";

function isMissingTableError(err: unknown): boolean {
  return (
    !!err &&
    typeof err === "object" &&
    "code" in err &&
    (err as { code?: string }).code === "42P01"
  );
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ boardId: string }> }
) {
  const auth = await requireTesterId(req);
  if(!auth.ok) return auth.response;

  const { boardId } = await ctx.params;
  const url = new URL(req.url);
  let cursor = parseInt(url.searchParams.get("cursor") || "0", 10);
  if(isNaN(cursor)) cursor = 0;

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
          // Stream may already be closed by disconnect or error path.
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

      if (!safeEnqueue(`retry: 5000\n\n`)) return;

      heartbeat = setInterval(() => {
        if (closed) return;
        safeEnqueue(`event: heartbeat\ndata: {}\n\n`);
      }, 15000);

      try {
        await ensureSharedBoardsSchema(query);
        const mem = await query(
          `select 1 from shared_board_memberships
          where board_id = $1::uuid and tester_id = $2::uuid limit 1`,
          [boardId, auth.testerId],
        );
        if((mem.rows?.length ?? 0) === 0) {
          safeEnqueue(
            `event: error\ndata: ${JSON.stringify({ error: "unauthorized" })}\n\n`
          );
          cleanup();
          return;
        }

        while(!closed){
          let res;
          try {
            res = await query(
              `select id, event_type, payload, extract(epoch from created_at)*1000 as ts
              from shared_board_events
              where board_id = $1::uuid and id > $2
              order by id asc limit 20`,
              [boardId, cursor]
            );
          } catch (e) {
            if (!isMissingTableError(e)) throw e;
            // Recover from partial/missing schema without restarting server.
            await ensureSharedBoardsSchema(query);
            await new Promise((r) => setTimeout(r, 800));
            continue;
          }

          for (const row of res.rows) {
            if (!safeEnqueue(
              `event: board-event\ndata: ${JSON.stringify({
                id: row.id,
                type: row.event_type,
                payload: row.payload,
                ts: row.ts,
              })}\n\n`
            )) break;
            cursor = row.id;
          }

          await new Promise((r) => setTimeout(r, 800));
        }
      } catch (e) {
        console.error(e);
        safeEnqueue(
          `event: error\ndata: ${JSON.stringify({ error: "server_error" })}\n\n`
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