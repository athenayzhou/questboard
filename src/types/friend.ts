import type { BadgePlatePlacement } from "./user";

export type FriendStatus = "online" | "offline" | "idle";

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

export type FriendSummary = {
  userCode: string;
  displayName: string;
  badges: {
    displayedBadgeIds: string[];
    badgePlacements: BadgePlatePlacement[];
  };
  status: FriendStatus;
  recentActivity: FriendActivity[];
};
