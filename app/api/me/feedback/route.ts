import { NextResponse } from "next/server";
import { requireTesterId } from "@/lib/session";
import { query } from "@/lib/db";
import { getDisplayNameForTester } from "@/lib/userDisplayName";
import { consumeRateLimit, requestIp } from "@/lib/rateLimit";
import { errorJson, parseJsonBody } from "@/lib/apiResponses";
import { z } from "zod";

const MAX_BODY = 8000;
const FEEDBACK_LIMIT = 8;
const FEEDBACK_WINDOW_MS = 10 * 60_000;
const feedbackSchema = z.object({
  kind: z.enum(["feedback", "problem"]).optional(),
  body: z.string().trim().min(1, "body_required").max(MAX_BODY, "body_too_long"),
});

export async function POST(req: Request){
  try {
    const auth = await requireTesterId(req);
    if (!auth.ok) return auth.response;

    const rateKey = `feedback:${auth.testerId}:${requestIp(req)}`;
    const gate = consumeRateLimit({
      key: rateKey,
      limit: FEEDBACK_LIMIT,
      windowMs: FEEDBACK_WINDOW_MS,
    });
    if (!gate.allowed) {
      return errorJson("rate_limited", 429, {
        "retry-after": String(gate.retryAfterSec),
      });
    }

    const parsedBody = await parseJsonBody(req);
    if (!parsedBody.ok) return parsedBody.response;
    const parsed = feedbackSchema.safeParse(parsedBody.data);
    if (!parsed.success) {
      const first = parsed.error.issues[0]?.message;
      const error = first === "body_too_long" ? "body_too_long" : "body_required";
      return errorJson(error, 400);
    }
    const kind = parsed.data.kind ?? "feedback";
    const body = parsed.data.body;

    const displayNameSnapshot = await getDisplayNameForTester(auth.testerId);

    await query(
      `
      insert into feedback (tester_id, kind, body, display_name_snapshot)
      values ($1, $2, $3, $4)
      `,
      [auth.testerId, kind, body, displayNameSnapshot],
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/me/feedback failed:", error);
    return errorJson("server_error", 500);
  }
}