type QuestAction = {
  id: string;
  title: string;
  completed: boolean;
}

type QuestReward = {
  xp?: number;
  coins?: number;
  gems?: number;
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
  failedAt?: number | null;

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

  boardId?: string | null;
  acceptedByUserId?: string | null;
  completedByUserId?: string | null;
  sharedQuestPins?: Record<string, { pinned: boolean; order?: number }>;

  sentByUserId?: string | null;
  sentByName?: string | null;
  sentNote?: string | null;
  sentAt?: number | null;
  sourceQuestId?: string | null;

  /** Pure quest-to-quest collaboration (not a shared board). */
  collabQuest?: boolean;
  /** Membership state for this user on a collab quest (`active` can edit; `left` is read-only). */
  myState?: "active" | "left";
  /** Invitee-only: card is a pending invite (not yet accepted). */
  collabInvitePending?: boolean;
  /** Row id in `shared_quest_invites` for accept/decline. */
  collabInviteId?: string;
}

export type CompletedQuest = Quest & {
  status: "completed" | "failed";
  completedAt: number;
}
