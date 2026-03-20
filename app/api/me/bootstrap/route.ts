import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { hashSessionToken } from "@/lib/betaAuth";

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? "qb_session";

type SessionRow = {
  tester_id: string;
};

type JsonRow = {
  data: unknown;
};

const defaultPlayer = {
  profile: { name: "player" },
  achievements: {
    unlockedTitles: [],
    unlockedBadges: [],
    activeTitle: null,
    activeBadge: null,
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
  } catch (err: any) {
    if(err?.code === "42P01") return [];
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
        safeSelectData(`select data from player_states where tester_id = $1`, [
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

    const player = (playerRows[0] as object | undefined) ?? defaultPlayer;
    const quests = questRows as object[];
    const skillsArray = skillRows as Array<{ id?: string } & Record<string, unknown>>;
    const xpEvents = eventRows as object[];

    const skills = skillsArray.reduce<Record<string, unknown>>((acc, s) => {
      if(s.id) acc[String(s.id)] = s;
      return acc;
    }, {});

    const clientGame =
      (extensionRows[0] as Record<string, unknown> | undefined) ?? {};

    return NextResponse.json({
      ok: true,
      data: {
        player,
        quests,
        skills,
        xpEvents,
        clientGame,
      },
    });
  } catch (error) {
    console.error("GET /api/me/bootstrap failed:", error);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}