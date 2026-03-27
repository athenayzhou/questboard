import { NextResponse } from "next/server";
import { withTransaction } from "@/lib/db";
import { requireTesterId } from "@/lib/session";
import { errorJson } from "@/lib/apiResponses";
import { ensureFriendEdgesSchema } from "@/lib/friendsDb";

/**
 * Server-side reset hooks used by Settings > reset data.
 * Keeps friend relationships symmetric by removing all edges for this tester.
 */
export async function POST(req: Request) {
  const auth = await requireTesterId(req);
  if (!auth.ok) return auth.response;

  try {
    await withTransaction(async (tx) => {
      await ensureFriendEdgesSchema(tx);
      await tx(
        `
        delete from friend_edges
        where tester_low = $1::uuid or tester_high = $1::uuid
        `,
        [auth.testerId],
      );
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/me/reset-data failed:", error);
    return errorJson("server_error", 500);
  }
}
