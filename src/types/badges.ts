export type BadgeCriteria =
  | { type: "streak"; minDays: number }
  | { type: "questsInDay"; count: number }
  | { type: "totalCompleted"; count: number }
  | { type: "balance"; minSkills: number }
  | { type: "recovery"; minGapDays: number }
  | { type: "difficulty"; minHard: number }
  | { type: "timeliness"; minOnTime: number }
  | { type: "focus"; skillName: string; count: number }
  | { type: "consecutiveSuccess"; count: number }
  | { type: "evenDistribution"; days: number; maxPerDay: number }
  | { type: "categoryDiversity"; minCategories: number }
  | { type: "postFailureSuccess"; count: number }
  | { type: "earlyCompletion"; daysEarly: number; count: number }
  | { type: "skillFocus"; count: number; timeWindowDays: number }
