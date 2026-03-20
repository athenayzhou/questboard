import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getTesterIdFromRequest } from "@/lib/session";

type SkillLike = {
  id?: string;
}

export async function PUT(req: Request) {
  try{
    const testerId = await getTesterIdFromRequest(req);
    if(!testerId){
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as { skills?: unknown };
    if(!body?.skills || typeof body.skills !== "object"){
      return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
    }

    const skillValues = Object.values(body.skills as Record<string, SkillLike>);
    await query(`delete from skills where tester_id = $1`, [testerId]);

    for(const s of skillValues){
      if (!s?.id || typeof s.id !== "string") continue;
      await query(
        `
        insert into skills (id, tester_id, data, updated_at)
        values ($1::uuid, $2::uuid, $3::jsonb, now())
        `,
        [s.id, testerId, JSON.stringify(s)],
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PUT /api/me/skills failed:", error);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}