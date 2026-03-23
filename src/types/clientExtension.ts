import type { Evidence, Cluster, Candidate, Mastery } from "@/types/skills";
import type { Friend } from "@/types/friend";
import type { PendingSkill } from "@/store/name";

export type SettingsPersisted = {
  autoNameSkills: boolean;
  autoFailOverdueQuests: boolean;
};

/** Stored in `client_game_state.data` (full replace on PUT). */
export type ClientGameBlobV1 = {
  v: 1;
  evidence: Evidence[];
  candidates: [string, Candidate][];
  clusters: [string, Cluster][];
  learnedVerbs: string[];
  pendingSkills: PendingSkill[];
  masteries: Mastery[];
  streak: { currentDays: number; lastCompletion: string };
  friends: Friend[];
  settings: SettingsPersisted;
};
