import type { Friend } from "@/types/friend";

export async function fetchFriends(
  codes: string[],
): Promise<Friend[]>{
  const res = await fetch("/api/me/friends/summary", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ codes }),
  });

  const json = (await res.json()) as {
    ok?: boolean;
    data?: { summaries?: Friend[] };
  };
  if(!res.ok || !json.ok || !json.data?.summaries) return [];
  return json.data.summaries;
}