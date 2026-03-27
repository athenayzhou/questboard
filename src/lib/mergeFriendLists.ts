import { GOLDIE_FRIEND_ID } from "@/data/systemFriends";
import type { Friend, FriendStatus } from "@/types/friend";

export function mergeFriendLists(server: Friend[], local: Friend[]): Friend[] {
  const localById = new Map<string, Friend>();
  for (const f of local) {
    if (f.id === GOLDIE_FRIEND_ID) continue;
    localById.set(f.id, f);
  }
  const byId = new Map<string, Friend>();
  for (const f of server) {
    if (f.id === GOLDIE_FRIEND_ID) continue;
    const prev = localById.get(f.id);
    byId.set(f.id, {
      id: f.id,
      name: f.name.trim() || prev?.name || f.id,
      status: (prev?.status ?? f.status ?? "offline") as FriendStatus,
    });
  }
  return Array.from(byId.values());
}
