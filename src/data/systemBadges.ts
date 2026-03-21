import type { SystemBadge } from "../types/system";
import type { BadgeCriteria } from "../types/badges";

export type SystemBadgeDefinition = SystemBadge & { criteria: BadgeCriteria };

export const BADGE_IMAGE_BASE = "/badge";
export function getBadgeIconUrl(id: string): string {
  return `${BADGE_IMAGE_BASE}/${id}.png`;
}

export const SYSTEM_BADGES: Record<string, SystemBadgeDefinition> = {
  "daily-streak": {
    id: "daily-streak",
    display: "daily streak",
    description: "maintain a quest streak for 31 days",
    criteria: { type: "streak", minDays: 31 },
  },
  "productive-bursts": {
    id: "productive-bursts",
    display: "productive bursts",
    description: "complete 10 quests in a single day",
    criteria: { type: "questsInDay", count: 10 },
  },
  "quest-crusher": {
    id: "quest-crusher",
    display: "quest crusher",
    description: "complete 100 quests total",
    criteria: { type: "totalCompleted", count: 100 },
  },
  "well-rounded": {
    id: "well-rounded",
    display: "well rounded",
    description: "show progress across at least 10 different skills.",
    criteria: { type: "balance", minSkills: 10 },
  },
  "back-in-saddle": {
    id: "back-in-saddle",
    display: "back in the saddle",
    description: "return after 7+ days away and get back on track",
    criteria: { type: "recovery", minGapDays: 7 },
  },
  daredevil: {
    id: "daredevil",
    display: "daredevil",
    description: "complete 100 hard difficulty quests",
    criteria: { type: "difficulty", minHard: 100 },
  },
  "on-time": {
    id: "on-time",
    display: "on time",
    description: "finish at least 50 quests before their deadlines",
    criteria: { type: "timeliness", minOnTime: 50 },
  },
  "deep-diver": {
    id: "deep-diver",
    display: "deep diver",
    description: "complete 10 quests in one skill within 7 days",
    criteria: { type: "skillFocus", count: 10, timeWindowDays: 7 },
  },
  perfectionist: {
    id: "perfectionist",
    display: "perfectionist",
    description: "succeed on 100 quests in a row without failing",
    criteria: { type: "consecutiveSuccess", count: 100 },
  },
  "steady-pace": {
    id: "steady-pace",
    display: "steady pace",
    description: "spread quests evenly: at most 3 per day over 7 days",
    criteria: { type: "evenDistribution", days: 7, maxPerDay: 3 },
  },
  "jack-of-all-trades": {
    id: "jack-of-all-trades",
    display: "jack of all trades",
    description: "use at least 5 different categories",
    criteria: { type: "categoryDiversity", minCategories: 5 },
  },
  phoenix: {
    id: "phoenix",
    display: "phoenix",
    description: "bounce back: succeed 3 times after a failed quest",
    criteria: { type: "postFailureSuccess", count: 3 },
  },
  "early-bird": {
    id: "early-bird",
    display: "early bird",
    description: "finish 15 quests at least 2 days before deadline",
    criteria: { type: "earlyCompletion", daysEarly: 2, count: 15 },
  },
  "century-club": {
    id: "century-club",
    display: "century club",
    description: "complete 500 quests total",
    criteria: { type: "totalCompleted", count: 500 },
  },
  specialist: {
    id: "specialist",
    display: "specialist",
    description: "complete 15 quests in one skill within 30 days",
    criteria: { type: "skillFocus", count: 15, timeWindowDays: 30 },
  },
};
