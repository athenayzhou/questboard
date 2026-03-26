import { create } from "zustand";
import { useTutorialStore } from "@/onboarding/tutorialStore";
import { TUTORIAL_FIRST_LOOP_QUEST_ID } from "@/onboarding/tutorialConstants";
import { isTutorialSpotlightAllowed } from "@/onboarding/tutorialGating";
import { useQuestStore } from "@/store/quest";

export type OverlayType =
  | "profile"
  | "quests"
  | "logs"
  | "friends"
  | "skills"
  | "settings"
  | "feedback"
  | "addQuest"
  | "shop"
  | null;

type QuestPage = {
  id: string;
  x: number;
  y: number;
  z: number;
}

type OverlayState = {
  activeOverlay: OverlayType;
  openOverlay: (type: OverlayType) => void;
  closeOverlay: () => void;

  openQuestPages: QuestPage[];
  openQuest: (id: string) => void;
  closeAllQuests: () => void;
  closeQuest: (id: string) => void;
  bringToFront: (id: string) => void;
  moveQuest: (id: string, x: number, y: number) => void;

  /** Top-level quest overlay view. */
  questTopTab: "available" | "accepted" | "collab";
  setQuestTopTab: (tab: "available" | "accepted" | "collab") => void;

  /** Inner board tab (used by personal view and collab sub-tabs). */
  boardTab: "available" | "accepted";
  setBoardTab: (tab: "available" | "accepted") => void;

  questSearch: string;
  setQuestSearch: (search: string) => void;
  questFilters: {
    category?: string;
    difficulty?: string;
    status?: string;
  };
  setQuestFilters: (filters: Partial<OverlayState['questFilters']>) => void;
  clearQuestFilters: () => void;

  boardScope: "personal" | "shared";
  setBoardScope: (scope: "personal" | "shared") => void;
  addQuestTargetId: string | null;
  setAddQuestTargetId: (id: string | null) => void;
}

export const useOverlay = create<OverlayState>((set) => ({
  activeOverlay: null,
  openOverlay: (type) => {
    set(() => ({
      activeOverlay: type,
      openQuestPages: [],
    }));
    if (type) {
      const spotlight = `entry-${type}` as const;
      const sub = useTutorialStore.getState().currentSubquest;
      const quests = useQuestStore.getState().quests;
      if (
        sub?.spotlight === spotlight &&
        isTutorialSpotlightAllowed(sub, quests)
      ) {
        useTutorialStore.getState().markSubquestComplete(sub.id);
      }
    }
  },
  closeOverlay: () => 
    set((s) => ({
      activeOverlay: null,
      openQuestPages: s.activeOverlay === "quests" ? [] : s.openQuestPages,
      questTopTab: "available",
      boardScope: "personal",
      addQuestTargetId: null,
    })),
  
  openQuestPages: [],
  openQuest: (id) => {
    let didAdd = false;
    set((s) => {
      if (s.openQuestPages.some((q) => q.id === id)) return s;
      didAdd = true;
      const maxZ = Math.max(0, ...s.openQuestPages.map((q) => q.z));
      return {
        openQuestPages: [
          ...s.openQuestPages,
          {
            id,
            x: 80 + s.openQuestPages.length * 24,
            y: 80 + s.openQuestPages.length * 24,
            z: maxZ + 1,
          },
        ],
      };
    });
    if (!didAdd) return;
    const sub = useTutorialStore.getState().currentSubquest;
    const spot = sub?.spotlight;
    if (
      sub &&
      id === TUTORIAL_FIRST_LOOP_QUEST_ID &&
      (spot === "board-tutorial-card-available" ||
        spot === "board-tutorial-card-accepted")
    ) {
      useTutorialStore.getState().markSubquestComplete(sub.id);
    }
  },

  closeAllQuests: () =>
    set(() => ({
      openQuestPages: []
    })),
  closeQuest: (id) => 
    set((s) => ({
      openQuestPages: s.openQuestPages.filter((q) => q.id !== id),
    })),
  bringToFront: (id) =>
    set((s) => {
      const maxZ = Math.max(...s.openQuestPages.map((q) => q.z));
      return {
        openQuestPages: s.openQuestPages.map((q) =>
          q.id === id ? { ...q, z: maxZ + 1 } : q
        ),
      };
    }),
  moveQuest: (id, x, y) => 
    set((s) => ({
      openQuestPages: s.openQuestPages.map((q) =>
        q.id === id ? { ...q, x, y } : q
      )
    })),

  questTopTab: "available",
  setQuestTopTab: (questTopTab) => set({ questTopTab }),

  boardTab: "available",
  setBoardTab: (tab) => set({boardTab: tab}),

  questSearch: "",
  setQuestSearch: (search) => set({ questSearch: search }),
  questFilters: {},
  setQuestFilters: (filters) => 
    set(state => ({
      questFilters: { ...state.questFilters, ...filters }
    })),
  clearQuestFilters: () => set({ questFilters: {} }),

  boardScope: "personal",
  setBoardScope: (boardScope) => set({ boardScope }),
  addQuestTargetId: null,
  setAddQuestTargetId: (addQuestTargetId) =>
    set({ addQuestTargetId }),

}));