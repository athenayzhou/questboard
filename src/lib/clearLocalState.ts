import { useQuestStore } from "@/store/quest";
import { useSkillStore } from "@/store/skill";
import { useNameStore } from "@/store/name";
import { useMasteryStore } from "@/store/mastery";
import { useXPEventStore } from "@/store/xpEvent";
import { useUserStore } from "@/store/user";
import { useOverlay } from "@/store/overlay";
import { candidateStore, clusterStore, evidenceStore } from "@/store/bundledStores";
import { createDefaultUserData } from "@/lib/defaultUserData";
import { useSettingsStore } from "@/store/settings";
import { useFriendsStore } from "@/store/friends";
import { useStreakStore } from "@/store/streak";
import { hydrateLearnedVerbsFromExtension } from "@/utils/format/text";
import { useIdentityStore } from "@/store/identity";
import { useBoardStore } from "@/store/board";
import { useTutorialStore } from "@/onboarding/tutorialStore";
import { useBoardLayoutStore } from "@/store/boardLayout";
import { clearBoardLayoutLocalStorageKeys } from "@/lib/boardLayoutStorage";


export function clearLocalState(options?: {
  clearStorageKeys?: boolean;
  closeOverlays?: boolean;
  quietWrites?: boolean;
  /** When false, keeps userCode (e.g. in-app data reset while session stays valid). */
  resetIdentity?: boolean;
}) {
  const clearStorage = options?.clearStorageKeys ?? true;
  const closeOverlays = options?.closeOverlays ?? true;
  const quiet = options?.quietWrites ?? false;
  const resetIdentity = options?.resetIdentity ?? true;

  const defaultUser = createDefaultUserData();

  if (quiet) {
    useQuestStore.setState({ quests: [] });
    useSkillStore.setState({ skills: {} });
    useXPEventStore.setState({ events: [] });
    useUserStore.setState({ user: defaultUser });
  } else {
    useQuestStore.getState().setQuest([]);
    useSkillStore.setState({ skills: {} });
    useXPEventStore.getState().clear();
    useUserStore.getState().setUser(defaultUser);
  }

  useNameStore.setState({
    isNaming: false,
    pendingNaming: [],
    currentNameIndex: 0,
    pendingSkills: [],
  });

  useTutorialStore.getState().closeTutorialSkillNaming();

  useMasteryStore.setState({ masteries: [] });

  useSettingsStore.setState({
    autoNameSkills: false,
    autoFailOverdueQuests: false,
  });
  useFriendsStore.setState({ friends: [] });
  useStreakStore.setState({ currentDays: 0, lastCompletion: "" });
  hydrateLearnedVerbsFromExtension([]);

  if (resetIdentity) {
    useIdentityStore.getState().reset();
  }

  useBoardLayoutStore.getState().reset();
  clearBoardLayoutLocalStorageKeys();

  useBoardStore.getState().setBoards([]);

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
      localStorage.removeItem("userData");
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

  if (!quiet) {
    useTutorialStore.getState().resetTutorial();
  }
}
