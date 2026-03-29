import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TutorialSubquest } from "./tutorialTypes";
import { TUTORIAL_QUEST_TEMPLATES } from "./tutorialTemplates";
// import { ensureTutorialSkill } from "./tutorialSkill";

function flatSubquests(): TutorialSubquest[] {
  return TUTORIAL_QUEST_TEMPLATES.flatMap((t) => t.subquests);
}

function lastSubquestIndexForTemplate(templateId: string): number {
  const flat = flatSubquests();
  let last = -1;
  for (let i = 0; i < flat.length; i++) {
    const tmpl = TUTORIAL_QUEST_TEMPLATES.find((t) =>
      t.subquests.some((s) => s.id === flat[i].id),
    );
    if (tmpl?.templateId === templateId) last = i;
  }
  return last;
}

type TutorialResume = {
  subquestId: string;
  isActive: boolean;
};

type TutorialState = {
  seenInteractions: Set<string>;
  markSeen: (spotlightId: string) => void;
  hasSeen: (spotlightId: string) => boolean;

  isActive: boolean;
  completed: boolean;
  currentSubquestIndex: number;
  currentSubquest: TutorialSubquest | null;

  startTutorial: () => void;
  skipTutorial: () => void;
  markSubquestComplete: (subquestId: string) => void;
  canCompleteTutorialQuestForTemplate: (templateId: string) => boolean;
  tutorialSkillNamingSkillId: string | null;
  openTutorialSkillNaming: (skillId: string) => void;
  closeTutorialSkillNaming: () => void;

  tutorialCompleteModalOpen: boolean;
  openTutorialCompleteModal: () => void;
  closeTutorialCompleteModal: () => void;

  resetTutorial: () => void;
};

export const useTutorialStore = create<TutorialState>()(
  persist(
    (set, get) => ({
      seenInteractions: new Set(),
      isActive: false,
      completed: false,
      currentSubquestIndex: 0,
      currentSubquest: null,
      tutorialSkillNamingSkillId: null,
      tutorialCompleteModalOpen: false,

      openTutorialCompleteModal: () => {
        set({ tutorialCompleteModalOpen: true });
      },
      closeTutorialCompleteModal: () => {
        set({ tutorialCompleteModalOpen: false });
      },

      openTutorialSkillNaming: (skillId: string) => {
        set({ tutorialSkillNamingSkillId: skillId });
      },
      closeTutorialSkillNaming: () => {
        set({ tutorialSkillNamingSkillId: null });
      },

      markSeen: (spotlightId: string) => {
        set((state) => {
          const next = new Set(state.seenInteractions);
          next.add(spotlightId);
          return { seenInteractions: next };
        });
      },
      hasSeen: (spotlightId: string) => {
        return get().seenInteractions.has(spotlightId);
      },
      startTutorial: () => {
        const flat = flatSubquests();
        if (flat.length === 0) return;
        // ensureTutorialSkill();
        set({
          isActive: true,
          completed: false,
          currentSubquestIndex: 0,
          currentSubquest: flat[0],
        });
      },
      skipTutorial: () => {
        set({
          isActive: false,
          currentSubquest: null,
          completed: true,
          tutorialSkillNamingSkillId: null,
        });
        localStorage.setItem("tutorial-completed", "true");
        void import("@/store/quest").then(({ useQuestStore }) => {
          useQuestStore.getState().removeInProgressTutorialQuests();
        });
      },
      markSubquestComplete: (subquestId: string) => {
        const state = get();
        if (!state.currentSubquest || state.currentSubquest.id !== subquestId) return;
        if (state.currentSubquest.spotlight) {
          get().markSeen(state.currentSubquest.spotlight);
        }
        const flat = flatSubquests();
        const nextIndex = state.currentSubquestIndex + 1;
        if (nextIndex >= flat.length) {
          set({
            isActive: false,
            currentSubquest: null,
            completed: true,
          });
          localStorage.setItem("tutorial-completed", "true");
          return;
        }
        set({
          currentSubquestIndex: nextIndex,
          currentSubquest: flat[nextIndex],
        });
      },

      canCompleteTutorialQuestForTemplate: (templateId: string) => {
        const state = get();
        if (!state.isActive) {
          return true;
        }
        const last = lastSubquestIndexForTemplate(templateId);
        if (last < 0) return true;
        return state.currentSubquestIndex > last;
      },

      resetTutorial: () => {
        localStorage.removeItem("tutorial-completed");
        set({
          seenInteractions: new Set(),
          isActive: false,
          completed: false,
          currentSubquestIndex: 0,
          currentSubquest: null,
          tutorialSkillNamingSkillId: null,
          tutorialCompleteModalOpen: false,
        });
      },
    }),
    {
      name: "tutorial-progress",
      partialize: (state) => ({
        seenInteractions: Array.from(state.seenInteractions),
        completed: state.completed,
        tutorialResume:
          state.completed || !state.isActive || !state.currentSubquest
            ? null
            : ({
                subquestId: state.currentSubquest.id,
                isActive: state.isActive,
              } satisfies TutorialResume),
      }),
      merge: (persistedState: unknown, currentState) => {
        const p = persistedState as {
          seenInteractions?: string[];
          completed?: boolean;
          tutorialResume?: TutorialResume | null;
        } | null;
        const fromLs =
          typeof localStorage !== "undefined" &&
          localStorage.getItem("tutorial-completed") === "true";
        const completed = p?.completed ?? fromLs;

        const base = {
          ...currentState,
          seenInteractions: new Set(p?.seenInteractions ?? []),
          completed,
        };

        if (completed) {
          return {
            ...base,
            isActive: false,
            currentSubquest: null,
            currentSubquestIndex: 0,
          };
        }

        const resume = p?.tutorialResume;
        if (resume?.subquestId) {
          const flat = flatSubquests();
          let resumeId = resume.subquestId;
          if (resumeId === "t05-c") resumeId = "t05-d";
          if (resumeId === "t05-a") resumeId = "t05-profile";
          if (resumeId === "t05-b") resumeId = "t05-shoplink";
          if (resumeId === "t05-quests") resumeId = "t05-profile";
          const idx = flat.findIndex((s) => s.id === resumeId);
          if (idx >= 0) {
            return {
              ...base,
              isActive: resume.isActive !== false,
              currentSubquestIndex: idx,
              currentSubquest: flat[idx],
            };
          }
          if (flat.length > 0) {
            return {
              ...base,
              isActive: true,
              currentSubquestIndex: 0,
              currentSubquest: flat[0],
            };
          }
        }

        return base;
      },
    },
  ),
);
