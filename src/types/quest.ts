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
  frequency?: "once"|"daily"|"weekly"|"monthly"|"custom";
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
}

export type CompletedQuest = Quest & {
  status: "completed" | "failed";
  completedAt: number;
}