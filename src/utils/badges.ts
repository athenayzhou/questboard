import type { BadgeCriteria } from "../types/badges";
import type { Quest } from "../types/quest";
import type { XPEvent } from "../types/skills";

export type BadgeState = {
  currentStreakDays: number;
  quests: Quest[];
  unlockedBadges: string[];
  xpEvents: XPEvent[];
};

function evaluateStreak(minDays: number, currentStreakDays: number): boolean {
  return currentStreakDays >= minDays;
}

function evaluateQuestsInDay(count: number, quests: Quest[]): boolean {
  const today = new Date().toDateString();
  const completedToday = quests.filter(
    (q) =>
      q.status === "completed" &&
      q.completedAt != null &&
      new Date(q.completedAt).toDateString() === today
  );
  return completedToday.length >= count;
}

function evaluateTotalCompleted(count: number, quests: Quest[]): boolean {
  const completed = quests.filter((q) => q.status === "completed");
  return completed.length >= count;
}

function evaluateBalance(minSkills: number, quests: Quest[]): boolean {
  const categories = new Set<string>();
  quests
    .filter((q) => q.status === "completed" && q.category?.length)
    .forEach((q) => q.category!.forEach((c) => categories.add(c)));
  return categories.size >= minSkills;
}

function evaluateRecovery(minGapDays: number, quests: Quest[], currentStreakDays: number): boolean {
  if (currentStreakDays !== 1) return false;
  const completed = quests
    .filter((q) => q.status === "completed" && q.completedAt != null)
    .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0));
  if (completed.length < 2) return false;
  const today = new Date().toDateString();
  const mostRecent = new Date(completed[0].completedAt!).toDateString();
  if (mostRecent !== today) return false;
  const gapMs = (completed[0].completedAt ?? 0) - (completed[1].completedAt ?? 0);
  return gapMs >= minGapDays * 24 * 60 * 60 * 1000;
}

function evaluateDifficulty(minHard: number, quests: Quest[]): boolean {
  const hardCompleted = quests.filter(
    (q) => q.status === "completed" && q.difficulty === "hard"
  );
  return hardCompleted.length >= minHard;
}

function evaluateTimeliness(minOnTime: number, quests: Quest[]): boolean {
  const onTime = quests.filter((q) => {
    if (q.status !== "completed" || q.completedAt == null || !q.deadline) return false;
    return new Date(q.completedAt) <= new Date(q.deadline);
  });
  return onTime.length >= minOnTime;
}

function evaluateFocus(skillName: string, count: number, _quests: Quest[], xpEvents: XPEvent[]): boolean {
  const bySkill = xpEvents.filter((e) => e.skillId && e.name?.toLowerCase().includes(skillName.toLowerCase()));
  return bySkill.length >= count;
}

function evaluateConsecutiveSuccess(count: number, quests: Quest[]): boolean {
  const withDate = quests
    .filter((q) => q.status === "completed" || q.status === "failed")
    .filter((q) => q.completedAt != null)
    .sort((a, b) => (a.completedAt ?? 0) - (b.completedAt ?? 0));
  let maxRun = 0;
  let run = 0;
  for (const q of withDate) {
    if (q.status === "completed") {
      run++;
      maxRun = Math.max(maxRun, run);
    } else {
      run = 0;
    }
  }
  return maxRun >= count;
}

function evaluateEvenDistribution(days: number, maxPerDay: number, quests: Quest[]): boolean {
  const completed = quests.filter((q) => q.status === "completed" && q.completedAt != null);
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const byDay: Record<string, number> = {};
  for (const q of completed) {
    const t = q.completedAt!;
    if (t < cutoff) continue;
    const day = new Date(t).toDateString();
    byDay[day] = (byDay[day] ?? 0) + 1;
  }
  return Object.values(byDay).every((n) => n <= maxPerDay) && Object.keys(byDay).length > 0;
}

function evaluateCategoryDiversity(minCategories: number, quests: Quest[]): boolean {
  const categories = new Set<string>();
  quests
    .filter((q) => q.status === "completed" && q.category?.length)
    .forEach((q) => q.category!.forEach((c) => categories.add(c)));
  return categories.size >= minCategories;
}

function evaluatePostFailureSuccess(count: number, quests: Quest[]): boolean {
  const withDate = quests
    .filter((q) => q.status === "completed" || q.status === "failed")
    .filter((q) => q.completedAt != null)
    .sort((a, b) => (a.completedAt ?? 0) - (b.completedAt ?? 0));
  let run = 0;
  for (const q of withDate) {
    if (q.status === "completed") {
      run++;
      if (run >= count) return true;
    } else {
      run = 0;
    }
  }
  return false;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function evaluateEarlyCompletion(daysEarly: number, count: number, quests: Quest[]): boolean {
  const margin = daysEarly * MS_PER_DAY;
  const early = quests.filter((q) => {
    if (q.status !== "completed" || q.completedAt == null || !q.deadline) return false;
    const deadline = new Date(q.deadline).getTime();
    const completed = q.completedAt;
    return completed <= deadline - margin;
  });
  return early.length >= count;
}

function evaluateSkillFocus(count: number, timeWindowDays: number, xpEvents: XPEvent[]): boolean {
  const cutoff = Date.now() - timeWindowDays * MS_PER_DAY;
  const recent = xpEvents.filter((e) => e.timestamp >= cutoff && e.skillId);
  const bySkill: Record<string, number> = {};
  for (const e of recent) {
    const id = e.skillId ?? "";
    bySkill[id] = (bySkill[id] ?? 0) + 1;
  }
  return Object.values(bySkill).some((n) => n >= count);
}

function evaluateBadge(criteria: BadgeCriteria, state: BadgeState): boolean {
  switch (criteria.type) {
    case "streak":
      return evaluateStreak(criteria.minDays, state.currentStreakDays);
    case "questsInDay":
      return evaluateQuestsInDay(criteria.count, state.quests);
    case "totalCompleted":
      return evaluateTotalCompleted(criteria.count, state.quests);
    case "balance":
      return evaluateBalance(criteria.minSkills, state.quests);
    case "recovery":
      return evaluateRecovery(criteria.minGapDays, state.quests, state.currentStreakDays);
    case "difficulty":
      return evaluateDifficulty(criteria.minHard, state.quests);
    case "timeliness":
      return evaluateTimeliness(criteria.minOnTime, state.quests);
    case "focus":
      return evaluateFocus(criteria.skillName, criteria.count, state.quests, state.xpEvents);
    case "consecutiveSuccess":
      return evaluateConsecutiveSuccess(criteria.count, state.quests);
    case "evenDistribution":
      return evaluateEvenDistribution(criteria.days, criteria.maxPerDay, state.quests);
    case "categoryDiversity":
      return evaluateCategoryDiversity(criteria.minCategories, state.quests);
    case "postFailureSuccess":
      return evaluatePostFailureSuccess(criteria.count, state.quests);
    case "earlyCompletion":
      return evaluateEarlyCompletion(criteria.daysEarly, criteria.count, state.quests);
    case "skillFocus":
      return evaluateSkillFocus(criteria.count, criteria.timeWindowDays, state.xpEvents);
    default:
      return false;
  }
}

export function getBadges(
  badgesMap: Record<string, { criteria: BadgeCriteria }>,
  currentState: BadgeState
): string[] {
  const earned: string[] = [];
  for (const [badgeId, badge] of Object.entries(badgesMap)) {
    if (currentState.unlockedBadges.includes(badgeId)) continue;
    if (evaluateBadge(badge.criteria, currentState)) {
      earned.push(badgeId);
    }
  }
  return earned;
}
