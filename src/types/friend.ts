import type { BadgePlatePlacement } from "./player";

export type FriendStatus = "online" | "offline" | "idle";

/** Persisted list entry (local store + extension sync). */
export type Friend = {
  id: string;
  name: string;
  status: FriendStatus;
};

export type FriendActivity = {
  id: string;
  amount: number;
  timestamp: number;
  name?: string;
  questTitle?: string;
  source?: string;
};

/** Server-computed row for friends overlay (status + optional activity). */
export type FriendSummary = {
  playerCode: string;
  displayName: string;
  badges: {
    displayedBadgeIds: string[];
    badgePlacements: BadgePlatePlacement[];
  };
  status: FriendStatus;
  recentActivity: FriendActivity[];
};
