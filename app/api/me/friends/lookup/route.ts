import { NextResponse } from "next/server";
import { requireTesterId } from "@/lib/session";
import { query } from "@/lib/db";
import { normalizeUserCodeInput } from "@/utils/format/code";
import { errorJson } from "@/lib/apiResponses";

export async function GET(req: Request) {
  try{
    const auth = await requireTesterId(req);
    if (!auth.ok) return auth.response;

    const url = new URL(req.url);
    const code = normalizeUserCodeInput(url.searchParams.get("code") ?? "");
    if(!code){
      return errorJson("invalid_code", 400);
    }

    const res = await query<{
      tester_id: string;
      user_code: string;
      display_name: string | null;
    }>(
      `
      select
        t.id as tester_id,
        t.user_code,
        ps.data->'profile'->>'name' as display_name
      from testers t
      left join user_states ps on ps.user_id = t.id
      where t.user_code = $1
      limit 1
      `,
      [code],
    );

    const row = res.rows[0];
    if(!row){
      return errorJson("not_found", 404);
    }
    if(row.tester_id === auth.testerId){
      return errorJson("self", 400);
    }

    return NextResponse.json({
      ok: true,
      data: {
        userCode: row.user_code,
        displayName: row.display_name?.trim() || "friend",
      },
    });
  } catch (error) {
    console.error("GET /api/me/friends/lookup failed:", error);
    return errorJson("server_error", 500);
  }
}