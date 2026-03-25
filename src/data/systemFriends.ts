import type { BadgePlatePlacement } from "@/types/user";
import type { Friend, FriendActivity } from "@/types/friend";

export const GOLDIE_FRIEND_ID = "QB-11111111";
export const GOLDIE_PORTRAIT_IMAGE = "/character/goldie.png";

export type SystemFriendUiDetail = {
  badgePlacements: BadgePlatePlacement[];
  activity: FriendActivity[];
  portraitUrl?: string;
};

export const SYSTEM_FRIEND_GOLDIE: Friend = {
  id: GOLDIE_FRIEND_ID,
  name: "goldie",
  status: "online",
};

function act(
  prefix: string,
  now: number,
  rows: Array<{ amount: number; offsetMs: number; name: string }>,
): FriendActivity[] {
  return rows.map((r, i) => ({
    id: `${prefix}-${i}`,
    amount: r.amount,
    timestamp: now - r.offsetMs,
    name: r.name,
  }));
}

const GOLDIE_BADGES: BadgePlatePlacement[] = [
  { id: "daily-streak", x: 0.1, y: 0.14 },
  { id: "quest-crusher", x: 0.9, y: 0.16 },
];

export function getSystemFriendUi(now: number): SystemFriendUiDetail {
  return {
    portraitUrl: GOLDIE_PORTRAIT_IMAGE,
    badgePlacements: GOLDIE_BADGES,
    activity: act("goldie", now, [
      { amount: 28, offsetMs: 3 * 60_000, name: "sourdough shaping" },
      { amount: 15, offsetMs: 55 * 60_000, name: "pie crust lamination" },
      { amount: 9, offsetMs: 2 * 60 * 60_000, name: "batch baking cookies" },
    ]),
  };
}

export function getSystemFriendUiDetail(
  friendId: string,
  now: number = Date.now(),
): SystemFriendUiDetail | null {
  if (friendId !== GOLDIE_FRIEND_ID) return null;
  return getSystemFriendUi(now);
}
