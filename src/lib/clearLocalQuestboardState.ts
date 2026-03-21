import { useQuestStore } from "@/store/quest";
import { useSkillStore } from "@/store/skill";
import { useNameStore } from "@/store/name";
import { useMasteryStore } from "@/store/mastery";
import { useXPEventStore } from "@/store/xpEvent";
import { usePlayerStore } from "@/store/player";
import { useOverlay } from "@/store/overlay";
import { candidateStore, clusterStore, evidenceStore } from "@/store/bundledStores";
import { createDefaultPlayerData } from "@/lib/defaultPlayerData";
import { useQuestboardSettings } from "@/store/questboardSettings";
import { useFriendsStore } from "@/store/friends";
import { useStreakStore } from "@/store/streak";
import { hydrateLearnedVerbsFromExtension } from "@/utils/format/text";
import { useIdentityStore } from "@/store/identity";

/**
 * Clears quests, skills, XP events, mastery, naming pipeline, bundled skill-gen stores,
 * and resets player to defaults.
 *
 * - Default: uses store actions so debounced server sync runs (logged-in reset).
 * - `quietWrites: true`: only Zustand `setState` — no PUT scheduling (session expiry / sign-out).
 */
export function clearLocalQuestboardState(options?: {
  clearStorageKeys?: boolean;
  closeOverlays?: boolean;
  /** Skip setQuest / setPlayer / clear side effects that schedule server sync */
  quietWrites?: boolean;
}) {
  const clearStorage = options?.clearStorageKeys ?? true;
  const closeOverlays = options?.closeOverlays ?? true;
  const quiet = options?.quietWrites ?? false;

  const defaultPlayer = createDefaultPlayerData();

  if (quiet) {
    useQuestStore.setState({ quests: [] });
    useSkillStore.setState({ skills: {} });
    useXPEventStore.setState({ events: [] });
    usePlayerStore.setState({ player: defaultPlayer });
  } else {
    useQuestStore.getState().setQuest([]);
    useSkillStore.setState({ skills: {} });
    useXPEventStore.getState().clear();
    usePlayerStore.getState().setPlayer(defaultPlayer);
  }

  useNameStore.setState({
    isNaming: false,
    pendingNaming: [],
    currentNameIndex: 0,
    pendingSkills: [],
  });

  useMasteryStore.setState({ masteries: [] });

  useQuestboardSettings.setState({
    autoNameSkills: true,
    autoFailOverdueQuests: false,
  });
  useFriendsStore.setState({ friends: [] });
  useStreakStore.setState({ currentDays: 0, lastCompletion: "" });
  hydrateLearnedVerbsFromExtension([]);

  useIdentityStore.getState().reset();

  candidateStore.clear();
  clusterStore.clear();
  evidenceStore.clear();

  if (clearStorage) {
    try {
      localStorage.setItem("skills", "{}");
      localStorage.setItem("xpEvents", "[]");
      localStorage.setItem("masteries", "[]");
      localStorage.setItem("pendingSkills", "[]");
      localStorage.setItem("candidates", "[]");
      localStorage.setItem("clusters", "[]");
      localStorage.removeItem("evidence");
      localStorage.removeItem("learnedVerbs");
      localStorage.removeItem("playerData");
      localStorage.removeItem("quests");
      localStorage.removeItem("friends");
      localStorage.removeItem("streak");
      localStorage.removeItem("autoNameSkills");
      localStorage.removeItem("autoFailOverdueQuests");
    } catch {
      // ignore
    }
  }

  if (closeOverlays) {
    useOverlay.getState().closeAllQuests();
  }
}
