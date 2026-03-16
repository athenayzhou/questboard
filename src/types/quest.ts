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
}

export type CompletedQuest = Quest & {
  status: "completed" | "failed";
  completedAt: number;
}