type QuestAction = {
  id: string;
  title: string;
  completed: boolean;
}

type QuestReward = {
  xp?: number;
  currency?: number;
  items?: string[];
}

type QuestStatus = 
  | "available"
  | "accepted"
  | "completed"
  | "failed";

export type Quest = {
  id: string;
  title: string;
  description?: string;
  
  category?: string[];
  difficulty: "easy"|"medium"|"hard";
  priority?: "high"|"low";
  duration?: number;
  deadline?: string|null;
  subquests?: QuestAction[]

  reward?: QuestReward;
  status: QuestStatus;
  createdAt: number;
  acceptedAt?: number;
  completedAt?: number | null;

  pinned?: boolean;
  order?: number;

  x?: number;
  y?: number;
  zIndex?: number;

  frequency?: "once"|"daily"|"weekly"|"monthly"|"custom";
  customFrequency?: number;
  isTemplate?: boolean;
  parentQuestId?: string;
  nextDueAt?: number;
  recurrenceCount?: number;
  paused?: boolean;

  isSystemGenerated?: boolean;
  systemType?: "seasonal" | "skill_guide" | "event" | "tutorial";
  generationCriteria?: {
    season?: string;
    skillTarget?: string;
    playerLevel?: number;
    requiredMasteries?: string[];
    dateRange?: { start: { month: number; day: number }; end: { month: number; day: number }}
  };
  expiresAfterDays?: number;
  expiresAt?: number;
}

export type CompletedQuest = Quest & {
  status: "completed" | "failed";
  completedAt: number;
}
