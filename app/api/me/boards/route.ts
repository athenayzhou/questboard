import { NextResponse } from "next/server";
import { query, withTransaction } from "@/lib/db";
import { requireTesterId } from "@/lib/session";
import { errorJson, parseJsonBody } from "@/lib/apiResponses";
import { ensureSharedBoardsSchema } from "@/lib/sharedBoardsDb";
import { assignUserCodeIfMissing } from "@/lib/userCode";
import { z } from "zod";

type BoardRow = {
  id: string;
  name: string;
  created_at: string;
};

type MemberRow = {
  board_id: string;
  user_code: string;
  display_name: string;
};

const createBoardSchema = z.object({
  name: z.string().min(1).max(64),
});

export async function GET(req: Request) {
  const auth = await requireTesterId(req);
  if (!auth.ok) return auth.response;

  try {
    // Ensure schema exists (stopgap). If the DB role can't create tables,
    // fall back to "no boards" instead of 500'ing the whole app.
    try {
      await withTransaction(async (tx) => {
        await ensureSharedBoardsSchema(tx);
      });
    } catch (e: unknown) {
      console.error("shared boards schema unavailable:", e);
      return NextResponse.json({ ok: true, boards: [] });
    }

    const boardsRes = await query<BoardRow>(
      `
      select b.id, b.name, b.created_at
      from shared_boards b
      join shared_board_memberships m on m.board_id = b.id
      where m.tester_id = $1
      order by b.created_at desc
      `,
      [auth.testerId],
    );

    const boardIds = boardsRes.rows.map((b) => b.id);
    let members: MemberRow[] = [];
    if (boardIds.length > 0) {
      const membersRes = await query<MemberRow>(
        `
        select board_id, user_code, display_name
        from shared_board_memberships
        where board_id = any($1::uuid[])
        `,
        [boardIds],
      );
      members = membersRes.rows;
    }

    const memberNamesByBoard = new Map<string, Record<string, string>>();
    for (const m of members) {
      const map = memberNamesByBoard.get(m.board_id) ?? {};
      map[m.user_code] = m.display_name;
      memberNamesByBoard.set(m.board_id, map);
    }

    const boards = boardsRes.rows.map((b) => ({
      id: b.id,
      name: b.name,
      createdAt: new Date(b.created_at).getTime(),
      memberNames: memberNamesByBoard.get(b.id) ?? {},
    }));

    return NextResponse.json({ ok: true, boards });
  } catch (e) {
    console.error("GET /api/me/boards failed:", e);
    return errorJson("server_error", 500);
  }
}

export async function POST(req: Request) {
  const auth = await requireTesterId(req);
  if (!auth.ok) return auth.response;

  const parsedBody = await parseJsonBody(req);
  if (!parsedBody.ok) return parsedBody.response;
  const parsed = createBoardSchema.safeParse(parsedBody.data);
  if (!parsed.success) return errorJson("invalid_payload", 400);

  try {
    const userCode = await assignUserCodeIfMissing(auth.testerId);
    const boardId = crypto.randomUUID();

    await withTransaction(async (tx) => {
      await ensureSharedBoardsSchema(tx);

      // Display name snapshot for this membership.
      const nameRes = await tx<{ data: unknown }>(
        `select data from user_states where user_id = $1 limit 1`,
        [auth.testerId],
      );
      const raw = nameRes.rows?.[0]?.data;
      const profileName =
        raw && typeof raw === "object" && "profile" in raw
          ? String(
              (raw as { profile?: { name?: unknown } }).profile?.name ??
                `player-${userCode.slice(0, 6)}`,
            )
          : `player-${userCode.slice(0, 6)}`;

      await tx(
        `insert into shared_boards (id, name) values ($1::uuid, $2)`,
        [boardId, parsed.data.name],
      );
      await tx(
        `
        insert into shared_board_memberships (board_id, tester_id, user_code, display_name, role)
        values ($1::uuid, $2::uuid, $3, $4, 'admin')
        `,
        [boardId, auth.testerId, userCode, String(profileName)],
      );
    });

    return NextResponse.json({ ok: true, boardId });
  } catch (e) {
    console.error("POST /api/me/boards failed:", e);
    return errorJson("server_error", 500);
  }
}

