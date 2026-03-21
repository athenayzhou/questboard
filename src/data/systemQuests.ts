import type { Quest } from "../types/quest";

export interface SystemQuestTemplate {
  id: string;
  title: string;
  description?: string;
  category?: string[];
  difficulty: "easy" | "medium" | "hard";
  reward?: Quest["reward"];
  systemType: "seasonal" | "skill_guide" | "event" | "tutorial";
  generationCriteria: {
    season?: string;
    skillTarget?: string;
    playerLevel?: number;
    requiredMasteries?: string[];
    dateRange?: { start: { month: number; day: number }; end: { month: number; day: number } };
  };
  expiresAfterDays?: number;
}

export const SYSTEM_QUESTS: SystemQuestTemplate[] = [
  {
    id: "seasonal-spring-cleaning",
    title: "Spring Cleaning Blitz",
    description: "Organize your workspace and tackle those lingering tasks",
    category: ["productivity", "organization"],
    difficulty: "medium",
    reward: { xp: 100, gems: 50 },
    systemType: "seasonal",
    generationCriteria: {
      season: "spring",
      dateRange: { start: { month: 2, day: 20 }, end: { month: 3, day: 30 } },
    },
    expiresAfterDays: 30,
  },
];

export function isDateInRange(
  date: Date,
  range?: SystemQuestTemplate["generationCriteria"]["dateRange"]
): boolean {
  if (!range) return false;
  const currentMonth = date.getMonth();
  const currentDay = date.getDate();
  const start = range.start;
  const end = range.end;

  if (start.month < end.month) {
    return (
      (currentMonth === start.month && currentDay >= start.day) ||
      (currentMonth === end.month && currentDay <= end.day) ||
      (currentMonth > start.month && currentMonth < end.month)
    );
  }
  if (start.month === end.month) {
    return currentMonth === start.month && currentDay >= start.day && currentDay <= end.day;
  }
  return (
    (currentMonth >= start.month && currentDay >= start.day) ||
    (currentMonth <= end.month && currentDay <= end.day)
  );
}
