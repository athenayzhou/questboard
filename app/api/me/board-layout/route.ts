import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireTesterId } from "@/lib/session";
import { errorJson, parseJsonBody } from "@/lib/apiResponses";
import { ensureBoardLayoutSchema } from "@/lib/boardLayoutDb";
import { z } from "zod";

const entrySchema = z.object({
  x: z.number(),
  y: z.number(),
  zIndex: z.number().optional().default(1),
});

const putSchema = z.object({
  surfaceKey: z
    .string()
    .min(1)
    .max(512)
    .regex(/^qb\.boardLayout\.v1:[^:]+:[^:]+:[^:]+$/),
  layout: z.record(z.string().min(1), entrySchema),
});

export async function PUT(req: Request) {
  const auth = await requireTesterId(req);
  if (!auth.ok) return auth.response;

  const parsedBody = await parseJsonBody(req);
  if (!parsedBody.ok) return parsedBody.response;

  const parsed = putSchema.safeParse(parsedBody.data);
  if (!parsed.success) {
    return errorJson("invalid_payload", 400);
  }

  const { surfaceKey, layout } = parsed.data;

  try {
    await ensureBoardLayoutSchema(query);
    await query(
      `
      insert into quest_board_layouts (tester_id, surface_key, layout, updated_at)
      values ($1::uuid, $2, $3::jsonb, now())
      on conflict (tester_id, surface_key) do update
      set layout = excluded.layout, updated_at = now()
      `,
      [auth.testerId, surfaceKey, JSON.stringify(layout)],
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PUT /api/me/board-layout failed:", error);
    return errorJson("server_error", 500);
  }
}
