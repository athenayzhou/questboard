import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getTesterIdFromRequest } from "@/lib/session";
import { normalizeUserCodeInput } from "@/utils/format/code";
import { statusFromSession } from "@/lib/statusServer";
import type { BadgePlatePlacement } from "@/types/user";
import type { FriendStatus, FriendActivity, FriendSummary } from "@/types/friend";

const MAX_CODES = 50;

type TesterRow = {
  tester_id: string;
  player_code: string;
  last_seen_at: string | null;
  has_session: boolean;
  player_data: unknown;
};

function parsePublicBadgeInfo(data: unknown): {
  displayName: string;
  displayedBadgeIds: string[];
  badgePlacements: BadgePlatePlacement[];
} {
  const o = data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  const profile = o.profile && typeof o.profile === "object" ? (o.profile as Record<string, unknown>) : {};
  const badgeBlob =
    o.badges && typeof o.badges === "object"
      ? (o.badges as Record<string, unknown>)
      : o.achievements && typeof o.achievements === "object"
        ? (o.achievements as Record<string, unknown>)
        : {};
  const displayName =
    typeof profile.name === "string" && profile.name.trim()
      ? profile.name.trim()
      : "friend";

  let displayedBadgeIds: string[] = [];
  if (Array.isArray(badgeBlob.displayedBadgeIds)) {
    displayedBadgeIds = badgeBlob.displayedBadgeIds.filter(
      (x): x is string => typeof x === "string",
    );
  }

  let badgePlacements: BadgePlatePlacement[] = [];
  if (Array.isArray(badgeBlob.badgePlacements)) {
    badgePlacements = badgeBlob.badgePlacements
      .filter(
        (p): p is BadgePlatePlacement =>
          p &&
        typeof p === "object" &&
        typeof (p as BadgePlatePlacement).id === "string" &&
        typeof (p as BadgePlatePlacement).x === "number" &&
        typeof (p as BadgePlatePlacement).y === "number",
      )
      .map((p) => ({ id: p.id, x: p.x, y: p.y }));
  }
  
  return { displayName, displayedBadgeIds, badgePlacements };
}

function xpRowToActivity(row: { id: string; data: unknown }): FriendActivity | null {
  const d =
    row.data && typeof row.data === "object"
      ? (row.data as Record<string, unknown>)
      : {};
  const ts = d.timestamp;
  const timestamp = typeof ts === "number" ? ts : typeof ts === "string" ? Number(ts) : NaN;
  if(!Number.isFinite(timestamp)) return null;

  return {
    id: row.id,
    amount: typeof d.amount === "number" ? d.amount : 0,
    timestamp,
    name: typeof d.name === "string" ? d.name : undefined,
    questTitle: typeof d.questTitle === "string" ? d.questTitle : undefined,
    source: typeof d.source === "string" ? d.source : undefined,
  };
}

export async function POST(req: Request) {
  try {
    const selfId = await getTesterIdFromRequest(req);
    if(!selfId){
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as { codes?: unknown };
    if(!Array.isArray(body.codes)){
      return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
    }

    const raw = body.codes.map((c) => normalizeUserCodeInput(String(c ?? "")));
    const codes = [...new Set(raw.filter(Boolean))].slice(0, MAX_CODES);
    if (codes.length === 0) {
      return NextResponse.json({ ok: true, data: { summaries: [] as FriendSummary[] } });
    }

    const testerRes = await query<TesterRow>(
      `
      select
        t.id as tester_id,
        t.player_code,
        t.last_seen_at::text,
        exists (
          select 1 from tester_sessions ts
          where ts.tester_id = t.id and ts.expires_at > now()
        ) as has_session,
        ps.data as player_data
      from testers t
      left join player_states ps on ps.tester_id = t.id
      where t.player_code = any($1::text[])
      `,
      [codes],
    );

    const byCode = new Map<string, TesterRow>();
    for(const row of testerRes.rows){
      byCode.set(row.player_code, row);
    }

    const testerIds = testerRes.rows.map((r) => r.tester_id);
    const xpByTester = new Map<string, FriendActivity[]>();

    if(testerIds.length > 0){
      const xpRes = await query<{ tester_id: string; id: string; data: unknown }>(
        `
        with ranked as (
          select
            xp.tester_id,
            xp.id::text as id,
            xp.data,
            row_number() over (
              partition by xp.tester_id
              order by (xp.data->>'timestamp')::bigint desc nulls last
            ) as rn
          from xp_events xp
          where xp.tester_id = any($1::uuid[])
        )
        select tester_id, id, data from ranked where rn <= 3
        `,
        [testerIds],
      );

      for(const row of xpRes.rows){
        const act = xpRowToActivity({ id: row.id, data: row.data });
        if(!act) continue;
        const list = xpByTester.get(row.tester_id) ?? [];
        list.push(act);
        xpByTester.set(row.tester_id, list);
      }
    }

    const summaries: FriendSummary[] = [];
    const nowMs = Date.now();

    for (const code of codes) {
      const row = byCode.get(code);
      if (!row) continue;

      const info = parsePublicBadgeInfo(row.player_data);
      const lastSeen = row.last_seen_at ? new Date(row.last_seen_at) : null;
      const status: FriendStatus = statusFromSession(
        row.has_session,
        lastSeen,
        nowMs,
      );

      const recentActivity = (xpByTester.get(row.tester_id) ?? []).sort(
        (a, b) => b.timestamp - a.timestamp,
      );

      summaries.push({
        userCode: row.player_code,
        displayName: info.displayName,
        badges: {
          displayedBadgeIds: info.displayedBadgeIds,
          badgePlacements: info.badgePlacements,
        },
        status,
        recentActivity,
      });
    }

    return NextResponse.json({ ok: true, data: { summaries } });
  } catch (error) {
    console.error("POST /api/me/friends/summary failed:", error);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}