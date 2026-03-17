import type { SystemBadge } from "../types/system";
import type { BadgeCriteria } from "../types/badges";

export type SystemBadgeDefinition = SystemBadge & { criteria: BadgeCriteria };

/** Badges: display (id, display, icon) and criteria for earning. */
export const SYSTEM_BADGES: Record<string, SystemBadgeDefinition> = {
  daily_streak: {
    id: "daily_streak",
    display: "daily streak",
    criteria: { type: "streak", minDays: 7 },
  },
  productive_bursts: {
    id: "productive_bursts",
    display: "productive bursts",
    criteria: { type: "questsInDay", count: 5 },
  },
  quest_crusher: {
    id: "quest_crusher",
    display: "quest crusher",
    criteria: { type: "totalCompleted", count: 50 },
  },
  well_rounded: {
    id: "well_rounded",
    display: "well rounded",
    criteria: { type: "balance", minSkills: 4 },
  },
  back_in_saddle: {
    id: "back_in_saddle",
    display: "back in the saddle",
    criteria: { type: "recovery", minGapDays: 7 },
  },
  daredevil: {
    id: "daredevil",
    display: "daredevil",
    criteria: { type: "difficulty", minHard: 10 },
  },
  on_time: {
    id: "on_time",
    display: "on time",
    criteria: { type: "timeliness", minOnTime: 5 },
  },
  deep_diver: {
    id: "deep_diver",
    display: "deep diver",
    criteria: { type: "skillFocus", count: 5, timeWindowDays: 7 },
  },
  perfectionist: {
    id: "perfectionist",
    display: "perfectionist",
    criteria: { type: "consecutiveSuccess", count: 10 },
  },
  steady_pace: {
    id: "steady_pace",
    display: "steady pace",
    criteria: { type: "evenDistribution", days: 7, maxPerDay: 3 },
  },
  jack_of_all_trades: {
    id: "jack_of_all_trades",
    display: "jack of all trades",
    criteria: { type: "categoryDiversity", minCategories: 5 },
  },
  phoenix: {
    id: "phoenix",
    display: "phoenix",
    criteria: { type: "postFailureSuccess", count: 3 },
  },
  early_bird: {
    id: "early_bird",
    display: "early bird",
    criteria: { type: "earlyCompletion", daysEarly: 2, count: 5 },
  },
  century_club: {
    id: "century_club",
    display: "century club",
    criteria: { type: "totalCompleted", count: 100 },
  },
  specialist: {
    id: "specialist",
    display: "specialist",
    criteria: { type: "skillFocus", count: 10, timeWindowDays: 30 },
  },
};
