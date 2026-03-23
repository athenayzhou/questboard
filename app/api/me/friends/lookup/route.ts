import { NextResponse } from "next/server";
import { getTesterIdFromRequest } from "@/lib/session";
import { query } from "@/lib/db";
import { normalizeUserCodeInput } from "@/utils/format/code";

export async function GET(req: Request) {
  try{
    const selfId = await getTesterIdFromRequest(req);
    if(!selfId){
      return NextResponse.json({ ok: false, error: "unauthroized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const code = normalizeUserCodeInput(url.searchParams.get("code") ?? "");
    if(!code){
      return NextResponse.json({ ok: false, error: "invalid_code" }, { status: 400 });
    }

    const res = await query<{
      tester_id: string;
      player_code: string;
      display_name: string | null;
    }>(
      `
      select
        t.id as tester_id,
        t.player_code,
        ps.data->'profile'->>'name' as display_name
      from testers t
      left join player_states ps on ps.tester_id = t.id
      where t.player_code = $1
      limit 1
      `,
      [code],
    );

    const row = res.rows[0];
    if(!row){
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }
    if(row.tester_id === selfId){
      return NextResponse.json({ ok: false, error: "self" }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      data: {
        userCode: row.player_code,
        displayName: row.display_name?.trim() || "friend",
      },
    });
  } catch (error) {
    console.error("GET /api/me/friends/lookup failed:", error);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}