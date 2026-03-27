import type { Friend, FriendStatus } from "@/types/friend";
import { throwIfUnauthorized, isSessionExpiredError } from "./sessionRecovery";

export async function fetchFriendsFromServer(): Promise<Friend[]> {
  let res: Response;
  try {
    res = await fetch("/api/me/friends", {
      credentials: "include",
    });
  } catch (e) {
    if (isSessionExpiredError(e)) throw e;
    throw e;
  }
  await throwIfUnauthorized(res);
  const json = (await res.json().catch(() => null)) as {
    ok?: boolean;
    friends?: { id: string; name: string }[];
  } | null;
  if (!res.ok || !json?.ok || !Array.isArray(json.friends)) {
    return [];
  }
  return json.friends.map((f) => ({
    id: f.id,
    name: f.name?.trim() || f.id,
    status: "offline" as FriendStatus,
  }));
}

export async function addFriendOnServer(userCode: string): Promise<void> {
  let res: Response;
  try {
    res = await fetch("/api/me/friends", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userCode }),
    });
  } catch (e) {
    if (isSessionExpiredError(e)) throw e;
    throw e;
  }
  await throwIfUnauthorized(res);
  if (!res.ok) {
    const j = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(j?.error ?? `add friend failed: ${res.status}`);
  }
}

export async function removeFriendOnServer(userCode: string): Promise<void> {
  let res: Response;
  try {
    res = await fetch("/api/me/friends", {
      method: "DELETE",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userCode }),
    });
  } catch (e) {
    if (isSessionExpiredError(e)) throw e;
    throw e;
  }
  await throwIfUnauthorized(res);
  if (!res.ok) {
    const j = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(j?.error ?? `remove friend failed: ${res.status}`);
  }
}
