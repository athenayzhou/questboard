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

type QuestBase = {
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
  reward?: QuestReward
  createdAt: number;
  x?: number;
  y?: number;
  zIndex?: number;
}

export type Quest = 
  | (QuestBase & {
    status: "available" | "accepted";
    completedAt: null;
    })
  | (QuestBase & {
    status: "completed" | "failed";
    completedAt: number;
    })