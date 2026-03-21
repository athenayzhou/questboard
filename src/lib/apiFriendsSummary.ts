import type { FriendSummary } from "@/types/friend";

export async function fetchFriendSummaries(
  codes: string[],
): Promise<FriendSummary[]> {
  if (codes.length === 0) return [];
  const res = await fetch("/api/me/friends/summary", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ codes }),
  });
  const json = (await res.json()) as {
    ok?: boolean;
    data?: { summaries?: FriendSummary[] };
  };
  if (!res.ok || !json.ok || !Array.isArray(json.data?.summaries)) {
    return [];
  }
  return json.data.summaries;
}
