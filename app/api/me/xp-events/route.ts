import { NextResponse } from "next/server";
import { withTransaction } from "@/lib/db";
import { requireTesterId } from "@/lib/session";
import { xpEventRowIdFromClientId } from "@/lib/questRowId";
import { errorJson, parseJsonBody } from "@/lib/apiResponses";
import { z } from "zod";

type XPEventLike = {
  id?: string;
};

const xpEventSchema = z.object({
  id: z.string().optional(),
}).passthrough();

const xpEventsPayloadSchema = z.object({
  xpEvents: z.array(xpEventSchema),
});

export async function PUT(req: Request) {
  try {
    const auth = await requireTesterId(req);
    if (!auth.ok) return auth.response;

    const parsedBody = await parseJsonBody(req);
    if (!parsedBody.ok) return parsedBody.response;
    const parsed = xpEventsPayloadSchema.safeParse(parsedBody.data);
    if (!parsed.success) {
      return errorJson("invalid_payload", 400);
    }

    const xpEvents = parsed.data.xpEvents as XPEventLike[];

    const byRowId = new Map<string, XPEventLike>();
    for (const e of xpEvents) {
      if (!e?.id || typeof e.id !== "string") continue;
      const rowId = xpEventRowIdFromClientId(e.id, auth.testerId);
      byRowId.set(rowId, e);
    }

    await withTransaction(async (txQuery) => {
      await txQuery(`delete from xp_events where tester_id = $1`, [auth.testerId]);

      for (const [rowId, e] of byRowId) {
        await txQuery(
          `
          insert into xp_events (id, tester_id, data, updated_at)
          values ($1::uuid, $2::uuid, $3::jsonb, now())
          `,
          [rowId, auth.testerId, JSON.stringify(e)],
        );
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PUT /api/me/xp-events failed:", error);
    return errorJson("server_error", 500);
  }
}