import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { hashSessionToken } from "@/lib/betaAuth";
import { assignUserCodeIfMissing } from "@/lib/userCode";
import { DEFAULT_DISPLAY_NAME_PLACEHOLDER } from "@/lib/defaultUserData";
import { ensureFriendEdgesSchema } from "@/lib/friendsDb";
import { ensureBoardLayoutSchema } from "@/lib/boardLayoutDb";

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? "qb_session";

type SessionRow = {
  tester_id: string;
};

type JsonRow = {
  data: unknown;
};

const defaultUser = {
  profile: { name: DEFAULT_DISPLAY_NAME_PLACEHOLDER },
  badges: {
    unlockedBadges: [],
    displayedBadgeIds: [],
    badgePlacements: [],
  },
  equipment: {
    equipped: { head: null, body: null, accessory: null, weapon: null },
  },
  inventory: { items: {} },
  currencies: { coins: 0, gems: 0 },
};

async function safeSelectData(
  sql: string,
  params: unknown[],
): Promise<unknown[]> {
  try {
    const res = await query<JsonRow>(sql, params);
    return res.rows.map((r) => r.data);
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code?: string }).code === "42P01"
    ) {
      return [];
    }
    throw err;
  }
}

export async function GET(req: Request) {
  try{
    const cookieHeader = req.headers.get("cookie") ?? "";
    const cookies = Object.fromEntries(
      cookieHeader
        .split(";")
        .map((c)=> c.trim())
        .filter(Boolean)
        .map((c) => {
          const idx = c.indexOf("=");
          return [c.slice(0, idx), decodeURIComponent(c.slice(idx + 1))];
        }),
    );

    const rawToken = cookies[SESSION_COOKIE_NAME];
    if(!rawToken){
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const tokenHash = hashSessionToken(rawToken);
    
    const sessionRes = await query<SessionRow>(
      `
      select tester_id
      from tester_sessions
      where session_token_hash = $1
        and expires_at > now()
      order by created_at desc
      limit 1
      `,
      [tokenHash],
    );

    const session = sessionRes.rows[0];
    if(!session){
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const [playerRows, questRows, skillRows, eventRows, extensionRows] =
      await Promise.all([
        safeSelectData(`select data from user_states where user_id = $1`, [
          session.tester_id,
        ]),
        safeSelectData(`select data from quests where tester_id = $1`, [
          session.tester_id,
        ]),
        safeSelectData(`select data from skills where tester_id = $1`, [
          session.tester_id,
        ]),
        safeSelectData(`select data from xp_events where tester_id = $1`, [
          session.tester_id,
        ]),
        safeSelectData(`select data from client_game_state where tester_id = $1`, [
          session.tester_id,
        ]),
      ]);

    const user = (playerRows[0] as object | undefined) ?? defaultUser;
    const quests = questRows as object[];
    const skillsArray = skillRows as Array<{ id?: string } & Record<string, unknown>>;
    const xpEvents = eventRows as object[];

    const skills = skillsArray.reduce<Record<string, unknown>>((acc, s) => {
      if(s.id) acc[String(s.id)] = s;
      return acc;
    }, {});

    const clientGame =
      (extensionRows[0] as Record<string, unknown> | undefined) ?? {};
    
    const userCode = await assignUserCodeIfMissing(session.tester_id);

    try {
      await ensureFriendEdgesSchema(query);
    } catch (e) {
      console.error("ensureFriendEdgesSchema failed:", e);
    }

    let boardLayouts: Record<string, unknown> = {};
    try {
      await ensureBoardLayoutSchema(query);
      const layoutRes = await query<{ surface_key: string; layout: unknown }>(
        `select surface_key, layout from quest_board_layouts where tester_id = $1`,
        [session.tester_id],
      );
      for (const row of layoutRes.rows) {
        if (typeof row.surface_key === "string") {
          boardLayouts[row.surface_key] = row.layout ?? {};
        }
      }
    } catch (e) {
      console.error("board layouts bootstrap failed:", e);
    }

    let friendsNetwork: { id: string; name: string }[] = [];
    try {
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
        [session.tester_id],
      );
      friendsNetwork = frRes.rows;
    } catch (e) {
      if (
        e &&
        typeof e === "object" &&
        "code" in e &&
        (e as { code?: string }).code === "42P01"
      ) {
        friendsNetwork = [];
      } else {
        console.error("friend_edges list failed:", e);
      }
    }

    const boards = await safeSelectData(
      `
      select jsonb_build_object(
        'id', b.id,
        'name', b.name,
        'createdAt', extract(epoch from b.created_at) * 1000,
        'memberNames', coalesce(
          (
            select jsonb_object_agg(sm.user_code, sm.display_name)
            from shared_board_memberships sm
            where sm.board_id = b.id
          ),
          '{}'::jsonb
        )
      ) as data
      from shared_boards b
      join shared_board_memberships m on m.board_id = b.id
      where m.tester_id = $1
      order by b.created_at desc
      `,
      [session.tester_id],
    );

    return NextResponse.json({
      ok: true,
      data: {
        user,
        quests,
        skills,
        xpEvents,
        clientGame,
        userCode,
        boards,
        friendsNetwork,
        boardLayouts,
      },
    });
  } catch (error) {
    console.error("GET /api/me/bootstrap failed:", error);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}