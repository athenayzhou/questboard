import type { ClientGameBlobV1 } from "@/types/clientExtension";
import { evidenceStore, clusterStore, candidateStore } from "@/store/bundledStores";
import { useNameStore } from "@/store/name";
import { useMasteryStore } from "@/store/mastery";
import { useStreakStore } from "@/store/streak";
import { useFriendsStore } from "@/store/friends";
import { useQuestboardSettings } from "@/store/questboardSettings";
import {
  getLearnedVerbsForExtension,
  hydrateLearnedVerbsFromExtension,
} from "@/utils/format/text";

export function emptyClientGameBlob(): ClientGameBlobV1 {
  return {
    v: 1,
    evidence: [],
    candidates: [],
    clusters: [],
    learnedVerbs: [],
    pendingSkills: [],
    masteries: [],
    streak: { currentDays: 0, lastCompletion: "" },
    friends: [],
    settings: {
      autoNameSkills: true,
      autoFailOverdueQuests: false,
    },
  };
}

export function normalizeClientGameBlob(raw: unknown): ClientGameBlobV1 {
  const base = emptyClientGameBlob();
  if (!raw || typeof raw !== "object") return base;
  const o = raw as Partial<ClientGameBlobV1>;

  return {
    ...base,
    v: 1,
    evidence: Array.isArray(o.evidence) ? o.evidence : base.evidence,
    candidates: Array.isArray(o.candidates) ? o.candidates : base.candidates,
    clusters: Array.isArray(o.clusters) ? o.clusters : base.clusters,
    learnedVerbs: Array.isArray(o.learnedVerbs) ? o.learnedVerbs : base.learnedVerbs,
    pendingSkills: Array.isArray(o.pendingSkills) ? o.pendingSkills : base.pendingSkills,
    masteries: Array.isArray(o.masteries) ? o.masteries : base.masteries,
    streak: {
      currentDays:
        typeof o.streak?.currentDays === "number"
          ? o.streak.currentDays
          : base.streak.currentDays,
      lastCompletion:
        typeof o.streak?.lastCompletion === "string"
          ? o.streak.lastCompletion
          : base.streak.lastCompletion,
    },
    friends: Array.isArray(o.friends) ? o.friends : base.friends,
    settings: {
      autoNameSkills:
        typeof o.settings?.autoNameSkills === "boolean"
          ? o.settings.autoNameSkills
          : base.settings.autoNameSkills,
      autoFailOverdueQuests:
        typeof o.settings?.autoFailOverdueQuests === "boolean"
          ? o.settings.autoFailOverdueQuests
          : base.settings.autoFailOverdueQuests,
    },
  };
}

export function buildClientGameBlob(): ClientGameBlobV1 {
  const { autoNameSkills, autoFailOverdueQuests } =
    useQuestboardSettings.getState();
  const streak = useStreakStore.getState();

  return {
    v: 1,
    evidence: evidenceStore.getAll(),
    candidates: candidateStore.serialize(),
    clusters: clusterStore.serialize(),
    learnedVerbs: getLearnedVerbsForExtension(),
    pendingSkills: useNameStore.getState().pendingSkills,
    masteries: useMasteryStore.getState().masteries,
    streak: {
      currentDays: streak.currentDays,
      lastCompletion: streak.lastCompletion,
    },
    friends: useFriendsStore.getState().friends,
    settings: { autoNameSkills, autoFailOverdueQuests },
  };
}

/** Apply server snapshot to in-memory stores (caller should suppress extension sync). */
export function applyClientGameBlob(blob: ClientGameBlobV1) {
  const data = normalizeClientGameBlob(blob);

  evidenceStore.hydrate(data.evidence);
  candidateStore.hydrate(data.candidates);
  clusterStore.hydrate(data.clusters);

  hydrateLearnedVerbsFromExtension(data.learnedVerbs);

  useNameStore.setState({ pendingSkills: data.pendingSkills });
  useMasteryStore.setState({ masteries: data.masteries });
  useStreakStore.getState().hydrate(data.streak);
  useFriendsStore.getState().hydrate(data.friends);
  useQuestboardSettings.getState().hydrate(data.settings);
}
