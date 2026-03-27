import { NextResponse } from "next/server";
import { z } from "zod";
import { query, withTransaction } from "@/lib/db";
import { requireTesterId } from "@/lib/session";
import { errorJson, parseJsonBody } from "@/lib/apiResponses";
import { normalizeUserCodeInput } from "@/utils/format/code";
import { ensureFriendEdgesSchema } from "@/lib/friendsDb";

const bodySchema = z.object({
  userCode: z.string().max(64),
});

export async function GET(req: Request) {
  const auth = await requireTesterId(req);
  if (!auth.ok) return auth.response;

  try {
    await ensureFriendEdgesSchema(query);
    const frRes = await query<{ id: string; name: string }>(
      `
      select
        t.user_code as id,
        coalesce(nullif(trim(ps.data->'profile'->>'name'), ''), t.user_code) as name
      from friend_edges fe
      join testers t on t.id = (
        case when fe.tester_low = $1::uuid then fe.tester_high else fe.tester_low end
      )
      left join user_states ps on ps.user_id = t.id
      where fe.tester_low = $1::uuid or fe.tester_high = $1::uuid
      `,
      [auth.testerId],
    );
    return NextResponse.json({ ok: true, friends: frRes.rows });
  } catch (e) {
    console.error("GET /api/me/friends failed:", e);
    return errorJson("server_error", 500);
  }
}

export async function POST(req: Request) {
  const auth = await requireTesterId(req);
  if (!auth.ok) return auth.response;

  const parsedBody = await parseJsonBody(req);
  if (!parsedBody.ok) return parsedBody.response;

  const parsed = bodySchema.safeParse(parsedBody.data);
  if (!parsed.success) return errorJson("invalid_payload", 400);

  const code = normalizeUserCodeInput(parsed.data.userCode);
  if (!code) return errorJson("invalid_code", 400);

  try {
    await withTransaction(async (tx) => {
      await ensureFriendEdgesSchema(tx);

      const peerRes = await tx<{ id: string }>(
        `select id::text as id from testers where user_code = $1 limit 1`,
        [code],
      );
      const peerId = peerRes.rows[0]?.id;
      if (!peerId) throw new Error("not_found");
      if (peerId === auth.testerId) throw new Error("self");

      await tx(
        `
        insert into friend_edges (tester_low, tester_high)
        values (
          least($1::uuid, $2::uuid),
          greatest($1::uuid, $2::uuid)
        )
        on conflict do nothing
        `,
        [auth.testerId, peerId],
      );
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "not_found") return errorJson("not_found", 404);
    if (msg === "self") return errorJson("self", 400);
    console.error("POST /api/me/friends failed:", e);
    return errorJson("server_error", 500);
  }
}

export async function DELETE(req: Request) {
  const auth = await requireTesterId(req);
  if (!auth.ok) return auth.response;

  const parsedBody = await parseJsonBody(req);
  if (!parsedBody.ok) return parsedBody.response;

  const parsed = bodySchema.safeParse(parsedBody.data);
  if (!parsed.success) return errorJson("invalid_payload", 400);

  const code = normalizeUserCodeInput(parsed.data.userCode);
  if (!code) return errorJson("invalid_code", 400);

  try {
    await withTransaction(async (tx) => {
      await ensureFriendEdgesSchema(tx);

      const peerRes = await tx<{ id: string }>(
        `select id::text as id from testers where user_code = $1 limit 1`,
        [code],
      );
      const peerId = peerRes.rows[0]?.id;
      if (!peerId) throw new Error("not_found");
      if (peerId === auth.testerId) throw new Error("self");

      await tx(
        `
        delete from friend_edges
        where tester_low = least($1::uuid, $2::uuid)
          and tester_high = greatest($1::uuid, $2::uuid)
        `,
        [auth.testerId, peerId],
      );
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "not_found") return errorJson("not_found", 404);
    if (msg === "self") return errorJson("self", 400);
    console.error("DELETE /api/me/friends failed:", e);
    return errorJson("server_error", 500);
  }
}
