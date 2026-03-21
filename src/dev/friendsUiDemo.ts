/**
 * Dev-only friends list + UI details for `next dev` (bootstrap seed).
 * Not bundled into production behavior: seed runs only when `NODE_ENV === "development"`.
 * Not used by `db:seed-beta`.
 */
import type { BadgePlatePlacement } from "@/types/player";
import type { Friend, FriendActivity, FriendStatus } from "@/types/friend";

export type DevFriendDetail = {
  playerCode: string;
  displayName: string;
  status: FriendStatus;
  badgePlacements: BadgePlatePlacement[];
  activity: (now: number) => FriendActivity[];
};

/** Dev XP lines: `name` = skill label (friends overlay shows skill activity only, not quests). */
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

const DEV_FRIEND_DETAILS: readonly DevFriendDetail[] = [
  {
    playerCode: "QB-11111111",
    displayName: "goldie",
    status: "online",
    badgePlacements: [
      { id: "daily-streak", x: 0.1, y: 0.14 },
      { id: "quest-crusher", x: 0.9, y: 0.16 },
    ],
    activity: (now) =>
      act("dev-goldie", now, [
        { amount: 42, offsetMs: 2 * 60_000, name: "alchemy" },
        { amount: 12, offsetMs: 48 * 60_000, name: "gardening" },
        { amount: 5, offsetMs: 3 * 60 * 60_000, name: "weekly reset" },
      ]),
  },
  {
    playerCode: "QB-22222222",
    displayName: "samuel",
    status: "offline",
    badgePlacements: [
      { id: "productive-bursts", x: 0.2, y: 0.78 },
      { id: "well-rounded", x: 0.82, y: 0.72 },
    ],
    activity: (now) =>
      act("dev-samuel", now, [
        { amount: 8, offsetMs: 6 * 60_000, name: "woodworking" },
        { amount: 3, offsetMs: 90 * 60_000, name: "reading" },
        { amount: 24, offsetMs: 24 * 60 * 60_000, name: "running" },
      ]),
  },
  {
    playerCode: "QB-33333333",
    displayName: "kith",
    status: "idle",
    badgePlacements: [
      { id: "on-time", x: 0.12, y: 0.38 },
      { id: "back-in-saddle", x: 0.88, y: 0.2 },
    ],
    activity: (now) =>
      act("dev-kith", now, [
        { amount: 15, offsetMs: 5 * 60_000, name: "laundry" },
        { amount: 7, offsetMs: 40 * 60_000, name: "cooking" },
        { amount: 1, offsetMs: 2 * 60 * 60_000, name: "meditation" },
      ]),
  },
  {
    playerCode: "QB-44444444",
    displayName: "rowan",
    status: "online",
    badgePlacements: [
      { id: "daredevil", x: 0.34, y: 0.12 },
      { id: "deep-diver", x: 0.66, y: 0.82 },
    ],
    activity: (now) =>
      act("dev-rowan", now, [
        { amount: 99, offsetMs: 1 * 60_000, name: "combat" },
        { amount: 20, offsetMs: 30 * 60_000, name: "cartography" },
        { amount: 11, offsetMs: 5 * 60 * 60_000, name: "fishing" },
      ]),
  },
];

/** Persisted `Friend` rows — only applied in development (see `applyDevFriendsSeed`). */
export const DEV_SEED_FRIENDS: Friend[] = DEV_FRIEND_DETAILS.map((p) => ({
  id: p.playerCode,
  name: p.displayName,
  status: p.status,
}));

/** Local UI (name plate + activity) for dev-seeded ids; `null` in production or unknown ids. */
export function getDevFriendUiDetail(
  friendId: string,
  now: number = Date.now(),
): {
  badgePlacements: BadgePlatePlacement[];
  activity: FriendActivity[];
} | null {
  if (process.env.NODE_ENV !== "development") return null;
  const row = DEV_FRIEND_DETAILS.find((p) => p.playerCode === friendId);
  if (!row) return null;
  return {
    badgePlacements: row.badgePlacements,
    activity: row.activity(now),
  };
}
