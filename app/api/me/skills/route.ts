import { NextResponse } from "next/server";
import { withTransaction } from "@/lib/db";
import { requireTesterId } from "@/lib/session";
import { skillRowIdFromClientId } from "@/lib/questRowId";
import { errorJson, parseJsonBody } from "@/lib/apiResponses";
import { z } from "zod";

type SkillLike = {
  id?: string;
}

const skillSchema = z.object({
  id: z.string().optional(),
}).passthrough();

const skillsPayloadSchema = z.object({
  skills: z.record(z.string(), skillSchema),
});

export async function PUT(req: Request) {
  try{
    const auth = await requireTesterId(req);
    if (!auth.ok) return auth.response;

    const parsedBody = await parseJsonBody(req);
    if (!parsedBody.ok) return parsedBody.response;
    const parsed = skillsPayloadSchema.safeParse(parsedBody.data);
    if(!parsed.success){
      return errorJson("invalid_payload", 400);
    }

    const skillValues = Object.values(parsed.data.skills as Record<string, SkillLike>);

    const byRowId = new Map<string, SkillLike>();
    for (const s of skillValues) {
      if (!s?.id || typeof s.id !== "string") continue;
      const rowId = skillRowIdFromClientId(s.id, auth.testerId);
      byRowId.set(rowId, s);
    }

    await withTransaction(async (txQuery) => {
      await txQuery(`delete from skills where tester_id = $1`, [auth.testerId]);

      for (const [rowId, s] of byRowId) {
        await txQuery(
          `
          insert into skills (id, tester_id, data, updated_at)
          values ($1::uuid, $2::uuid, $3::jsonb, now())
          `,
          [rowId, auth.testerId, JSON.stringify(s)],
        );
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PUT /api/me/skills failed:", error);
    return errorJson("server_error", 500);
  }
}