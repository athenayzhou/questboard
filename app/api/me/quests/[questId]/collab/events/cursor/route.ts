import { NextResponse } from "next/server";
import { requireTesterId } from "@/lib/session";
import { query } from "@/lib/db";
import { ensureSharedQuestsSchema } from "@/lib/sharedQuestsDb";
import { errorJson } from "@/lib/apiResponses";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ questId: string }> },
) {
  const auth = await requireTesterId(_req);
  if (!auth.ok) return auth.response;

  const { questId } = await ctx.params;

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
    if ((mem.rows?.length ?? 0) === 0) return errorJson("unauthorized", 403);

    const res = await query<{ max: unknown }>(
      `select coalesce(max(id), 0)::bigint as max from shared_quest_events where quest_id = $1::uuid`,
      [questId],
    );
    const raw = res.rows?.[0]?.max;
    const cursor =
      typeof raw === "number" && Number.isFinite(raw)
        ? raw
        : typeof raw === "string"
          ? parseInt(raw, 10)
          : 0;
    const safe = Number.isFinite(cursor) ? cursor : 0;

    return NextResponse.json({ ok: true, cursor: safe });
  } catch (e) {
    console.error("GET collab events cursor failed:", e);
    return errorJson("server_error", 500);
  }
}
