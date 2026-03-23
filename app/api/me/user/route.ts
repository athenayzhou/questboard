import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireTesterId } from "@/lib/session";
import { errorJson, parseJsonBody } from "@/lib/apiResponses";
import { z } from "zod";

const userPayloadSchema = z.object({
  user: z
    .unknown()
    .refine(
      (v): v is Record<string, unknown> =>
        !!v && typeof v === "object" && !Array.isArray(v),
      "invalid_payload",
    ),
});

export async function PUT(req: Request) {
  try {
    const auth = await requireTesterId(req);
    if (!auth.ok) return auth.response;

    const parsedBody = await parseJsonBody(req);
    if (!parsedBody.ok) return parsedBody.response;
    const parsed = userPayloadSchema.safeParse(parsedBody.data);
    if (!parsed.success) {
      return errorJson("invalid_payload", 400);
    }

    await query(
      `
      insert into player_states (tester_id, data, updated_at)
      values ($1, $2::jsonb, now())
      on conflict (tester_id)
      do update set data = excluded.data, updated_at = now()
      `,
      [auth.testerId, JSON.stringify(parsed.data.user)],
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PUT /api/me/user failed:", error);
    return errorJson("server_error", 500);
  }
}
