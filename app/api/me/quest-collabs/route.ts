import { NextResponse } from "next/server";
import { withTransaction } from "@/lib/db";
import { requireTesterId } from "@/lib/session";
import { errorJson } from "@/lib/apiResponses";
import { ensureSharedQuestsSchema } from "@/lib/sharedQuestsDb";

export async function GET(req: Request){
  const auth = await requireTesterId(req);
  if(!auth.ok) return auth.response;

  try {
    const res = await withTransaction(async (tx) => {
      await ensureSharedQuestsSchema(tx);

      const rows = await tx<{
        quest_id: string;
        data: unknown;
        my_state: string;
        quest_row_status: string;
      }>(
        `
        select
          q.id::text as quest_id,
          q.data as data,
          m.state as my_state,
          q.status as quest_row_status
        from shared_quest_memberships m
        join shared_quest_quests q on q.id = m.quest_id
        where m.tester_id = $1
        and m.state in ('active', 'left')
        order by q.created_at desc
        `,
        [auth.testerId],
      );

      return rows.rows;
    });

    const nowMs = Date.now();

    return NextResponse.json({
      ok: true,
      quests: res.map((r) => {
        const base =
          r.data && typeof r.data === "object"
            ? ({ ...(r.data as Record<string, unknown>) } as Record<string, unknown>)
            : {};
        const myState = r.my_state;
        const globalFailed = r.quest_row_status === "failed";

        if (myState === "left") {
          const ts =
            typeof base.failedAt === "number"
              ? base.failedAt
              : typeof base.completedAt === "number"
                ? base.completedAt
                : nowMs;
          return {
            ...base,
            collabQuest: true,
            myState: "left" as const,
            status: "failed" as const,
            failedAt: ts,
            completedAt: ts,
          };
        }

        if (globalFailed) {
          const ts =
            typeof base.failedAt === "number"
              ? base.failedAt
              : typeof base.completedAt === "number"
                ? base.completedAt
                : nowMs;
          return {
            ...base,
            collabQuest: true,
            myState: myState as "active" | "left",
            status: "failed" as const,
            failedAt: ts,
            completedAt: ts,
          };
        }

        return {
          ...base,
          collabQuest: true,
          myState: myState as "active" | "left",
        };
      }),
    });
  } catch (e) {
    console.error("GET /api/me/quest-collabs failed:", e);
    return errorJson("server_error", 500);
  }
}