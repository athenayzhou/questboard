import { NextResponse } from "next/server";
import { requireTesterId } from "@/lib/session";
import { errorJson, parseJsonBody } from "@/lib/apiResponses";
import { withTransaction } from "@/lib/db";
import { ensureSharedBoardsSchema } from "@/lib/sharedBoardsDb";
import { normalizeUserCodeInput } from "@/lib/userCode";
import { assignUserCodeIfMissing } from "@/lib/userCode";
import { z } from "zod";

type MemberRow = {
  user_code: string;
  display_name: string;
  role: string;
};

const inviteSchema = z.object({
  userCode: z.string().min(1),
});

export async function GET(
  req: Request,
  ctx: { params: Promise<{ boardId: string }> },
) {
  const auth = await requireTesterId(req);
  if (!auth.ok) return auth.response;
  const { boardId } = await ctx.params;

  try {
    return await withTransaction(async (tx) => {
      await ensureSharedBoardsSchema(tx);

      const memRes = await tx(
        `select 1 from shared_board_memberships where board_id = $1::uuid and tester_id = $2::uuid limit 1`,
        [boardId, auth.testerId],
      );
      if ((memRes.rows?.length ?? 0) === 0) return errorJson("unauthorized", 403);

      const res = await tx<MemberRow>(
        `
        select user_code, display_name, role
        from shared_board_memberships
        where board_id = $1::uuid
        order by created_at asc
        `,
        [boardId],
      );

      return NextResponse.json({ ok: true, members: res.rows });
    });
  } catch (e) {
    console.error("GET /api/boards/:boardId/members failed:", e);
    return errorJson("server_error", 500);
  }
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ boardId: string }> },
) {
  const auth = await requireTesterId(req);
  if (!auth.ok) return auth.response;
  const { boardId } = await ctx.params;

  const parsedBody = await parseJsonBody(req);
  if (!parsedBody.ok) return parsedBody.response;
  const parsed = inviteSchema.safeParse(parsedBody.data);
  if (!parsed.success) return errorJson("invalid_payload", 400);

  const wanted = normalizeUserCodeInput(parsed.data.userCode);
  if (!wanted) return errorJson("invalid_code", 400);

  try {
    return await withTransaction(async (tx) => {
      await ensureSharedBoardsSchema(tx);

      // Only admins can invite.
      const roleRes = await tx<{ role: string }>(
        `
        select role
        from shared_board_memberships
        where board_id = $1::uuid and tester_id = $2::uuid
        limit 1
        `,
        [boardId, auth.testerId],
      );
      const myRole = roleRes.rows?.[0]?.role;
      if (!myRole) return errorJson("unauthorized", 403);
      if (myRole !== "admin") return errorJson("unauthorized", 403);

      // Resolve tester_id by player_code.
      const targetRes = await tx<{ id: string }>(
        `select id::text as id from testers where player_code = $1 limit 1`,
        [wanted],
      );
      const targetTesterId = targetRes.rows?.[0]?.id;
      if (!targetTesterId) return errorJson("not_found", 404);
      if (targetTesterId === auth.testerId) return errorJson("self", 400);

      // Ensure target has a code (should already, but safe).
      const targetCode = await assignUserCodeIfMissing(targetTesterId);
      if (targetCode !== wanted) {
        // Extremely unlikely unless code normalization mismatch.
        return errorJson("invalid_code", 400);
      }

      // Display name snapshot from player state, fallback to code.
      const psRes = await tx<{ data: unknown }>(
        `select data from player_states where tester_id = $1 limit 1`,
        [targetTesterId],
      );
      const raw = psRes.rows?.[0]?.data;
      const displayName =
        raw && typeof raw === "object" && "profile" in raw
          ? String(
              (raw as { profile?: { name?: unknown } }).profile?.name ?? wanted,
            )
          : wanted;

      await tx(
        `
        insert into shared_board_memberships (board_id, tester_id, user_code, display_name, role)
        values ($1::uuid, $2::uuid, $3, $4, 'member')
        on conflict (board_id, tester_id) do nothing
        `,
        [boardId, targetTesterId, wanted, displayName],
      );

      return NextResponse.json({ ok: true });
    });
  } catch (e) {
    console.error("POST /api/boards/:boardId/members failed:", e);
    return errorJson("server_error", 500);
  }
}

