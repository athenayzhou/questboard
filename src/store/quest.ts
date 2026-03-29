import { create } from "zustand";
import type { Quest } from "../types/quest";
import { onQuestComplete } from "../hooks/onQuestComplete";
import { evidenceStore, candidateStore, clusterStore } from './bundledStores';
import { showToast } from "../utils/toast";
import { useStreakStore } from "./streak";
import { useUserStore } from "./user";
import { useNameStore } from "./name";
import { useXPEventStore } from "./xpEvent";
import { SYSTEM_BADGES } from "../data/systemBadges";
import { getBadges } from "../utils/badges";

import { devLog, devError } from "../dev/devLogs";
import { RecurringQuests } from "../utils/recurrence";
import { isQuestOverdue } from "../utils/recurrence";

import { scheduleQuestSync } from "@/lib/apiQuests";
import { useSettingsStore } from "@/store/settings";
import { grantQuestRewards } from "@/lib/questRewards";
import {
  isSystemGeneratedQuest,
  withComputedReward,
} from "@/lib/computeQuestReward";

import { isTutorial } from "@/onboarding/tutorialTypes";
import { applyTutorialRewards } from "@/onboarding/tutorialRewards";
import { awardTutorialQuestSkillXP } from "@/onboarding/tutorialSkill";
import { useTutorialStore } from "@/onboarding/tutorialStore";
import { dedupeQuestsById } from "@/lib/questDedupe";

import { isPersonalQuest, isQuestCollab } from "@/lib/boardScope";
import { useIdentityStore } from "./identity";
import {
  acceptSharedQuest,
  completeSharedQuest,
  failSharedQuest,
  patchBoardQuest,
  pinSharedQuest,
  reorderSharedPins,
} from "@/lib/apiBoards";
import {
  completeQuestForAll,
  giveUpQuest,
  toggleQuestSubquest,
} from "@/lib/apiQuestCollab";

type QuestState = {
  quests: Quest[];

  isLoading: boolean;
  operationLoading: Record<string, boolean>;
  setLoading: (loading: boolean) => void;
  setOperationLoading: (operation: string, loading: boolean) => void;

  setQuest: (q: Quest[] | ((prev: Quest[]) => Quest[])) => void;
  addQuest: (
    input: Omit<Quest, "id" | "status" | "createdAt" | "reward">
  ) => Quest;
  editQuest: (
    id: string,
    updates: Partial<Omit<Quest, "id" | "status" | "createdAt" | "reward">>
  ) => void;
  deleteQuest: (id: string) => void;
  acceptQuest: (id: string) => void;
  completeQuest: (id: string) => void;
  failQuest: (id: string) => void;
  duplicateQuest: (id: string) => Quest | null;

  togglePin: (id: string) => void;
  reorderPinned: (questId: string, newIndex: number) => void;
  toggleSubquest: (questId: string, subquestId: string) => void;

  processRecurrence: () => void;
  processAutoFail: () => void;
  createRecurrence: (
    quest: Omit<Quest, "id" | "status" | "createdAt" | "reward">
  ) => Quest;
  updateRecurrence: (templateId: string, updates: Partial<Quest>) => void;
  pauseRecurrence: (templateId: string) => void;
  resumeRecurrence: (templateId: string) => void;

  getAvailable: () => Quest[];
  getAccepted: () => Quest[];
  getPinned: () => Quest[];
  getQuestById: (id: string) => Quest | undefined;

  removeInProgressTutorialQuests: () => void;
}

function isOnUserStrip(q: Quest, me: string | null): boolean {
  if(q.status !== "accepted") return false;
  if(isPersonalQuest(q)) return q.pinned === true;
  if(!me || !q.boardId || q.acceptedByUserId !== me) return false;
  return q.sharedQuestPins?.[me]?.pinned === true;
}

function countStripPinned(
  quests: Quest[],
  me: string | null,
  excludeQuestId?: string,
): number {
  return quests.filter(
    (qq) => qq.id !== excludeQuestId && isOnUserStrip(qq, me),
  ).length;
}

function replaceQuestById(list: Quest[], quest: Quest): Quest[] {
  const i = list.findIndex((q) => q.id === quest.id);
  if (i === -1) return [...list, quest];
  return list.map((q, idx) => (idx === i ? quest : q));
}

export const useQuestStore = create<QuestState>((set, get) => ({
  quests: [],

  isLoading: false,
  operationLoading: {},
  setLoading: (loading) => set({ isLoading: loading }),
  setOperationLoading: (operation, loading) => set((state) => ({
    operationLoading: { ...state.operationLoading, [operation]: loading }
  })),

  removeInProgressTutorialQuests: () => {
    set((state) => {
      const next = state.quests.filter(
        (q) =>
          !(
            isTutorial(q) &&
            (q.status === "available" || q.status === "accepted")
          ),
      );
      if (next.length === state.quests.length) return state;
      scheduleQuestSync();
      return { quests: next };
    });
  },

  setQuest: (questsOrFn) => {
    set((state) => {
      const raw =
        typeof questsOrFn === "function"
          ? questsOrFn(state.quests)
          : questsOrFn;
      const quests = dedupeQuestsById(raw);
      if (quests === state.quests) return state;
      scheduleQuestSync();
      return { quests };
    });
  },

  addQuest: (input) => {
    const quest: Quest = withComputedReward({
      ...input,
      id: crypto.randomUUID(),
      status: "available",
      createdAt: Date.now(),
      pinned: false,
    });

    set((state) => {
      const next = [...state.quests, quest];
      scheduleQuestSync();
      return { quests: next };
    });

    return quest;
  },

  editQuest: (id, updates) => {
    const quest = get().quests.find((q) => q.id === id);
    if(!quest) return;

    if (quest.collabQuest) {
      showToast("info", "collab quests can't be edited here yet");
      return;
    }

    if(quest.boardId){
      get().setOperationLoading(`edit-${id}`, true);
      fetch(`/api/boards/${quest.boardId}/quests/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })
        .then((res) => {
          if(!res.ok) throw new Error("edit failed");
          return res.json();
        })
        .then(({ quest: updated }) => {
          if(!updated) return;
          set((s) => ({ quests: replaceQuestById(s.quests, updated as Quest) }));
          showToast("success", `quest "${updated.title}" updated`);
        })
        .catch((e) => {
          console.error(e);
          showToast("error", "failed to edit shared quest");
        })
        .finally(() => get().setOperationLoading(`edit-${id}`, false));
      return;
    }

    set((state) => {
      if(quest.status !== "available" || isSystemGeneratedQuest(quest)) return state;
      const updatedQuest = { ...quest, ...updates };
      const next = state.quests.map((q) => (q.id === id ? updatedQuest : q));
      scheduleQuestSync();
      return { quests: next };
    });
  },

  deleteQuest: (id) => {
    const quest = get().quests.find((q) => q.id === id);
    if (!quest) return;
    if (quest.collabQuest) {
      showToast("info", "collab quests can't be deleted from the board");
      return;
    }
    if (quest.boardId) {
      if(!confirm(`delete shared quest "${quest.title}"?`)) return;
      get().setOperationLoading(`delete-${id}`, true);
      fetch(`/api/boards/${quest.boardId}/quests/${id}`, {
        method: "DELETE",
        credentials: "include",
      })
        .then((res) => {
          if(!res.ok) throw new Error("delete failed");
          return res.json();
        })
        .then(() => {
          set((state) => ({
            quests: state.quests.filter((q) => q.id !== id),
          }));
          showToast("success", `shared quest "${quest.title}" deleted`);
        })
        .catch((e) => {
          console.error(e);
          showToast("error", "failed to delete shared quest");
        })
        .finally(() => get().setOperationLoading(`delete-${id}`, false));
      return;
    }
    if (isTutorial(quest)) {
      showToast("info", "tutorial quests can't be deleted");
      return;
    }
    if(quest.isSystemGenerated === true){
      showToast("info", "system quests cannto be deleted");
    }
    set((state) => {
      const next = state.quests.filter((q) => q.id !== id);
      scheduleQuestSync();
      return { quests: next };
    });
    showToast("success", "quest deleted");
  },

  acceptQuest: (id) => {
    const quest = get().quests.find(q => q.id === id);
    if(!quest) return;

    if (quest.collabQuest) return;

    if(quest.boardId){
      acceptSharedQuest(quest.boardId, quest.id)
        .then(({ quest: updated }) => {
          if (!updated) return;
          set((s) => ({ quests: replaceQuestById(s.quests, updated) }));
          showToast("success", `quest "${updated.title}" accepted`);
        })
        .catch((e) => {
          console.error(e);
          showToast("error", "failed to accept shared quest");
        });
      return;
    }
    
    set((state) => ({
      quests: state.quests.map(q =>
        q.id === id 
          ? {
              ...q, 
              status: "accepted" as Quest["status"], 
              acceptedAt: Date.now() } 
          : q
      ),
    }));
    scheduleQuestSync();
    showToast("success", `quest "${quest.title}" accepted`);
    devLog("quest", "quest accepted", { id, title: quest.title });
  },

  completeQuest: (id: string) => {
    const quest = get().quests.find(q => q.id === id);
    if (!quest || quest.status !== "accepted") return;
    const me = useIdentityStore.getState().userCode;
    if (quest.collabQuest) {
      if (quest.myState !== "active") {
        showToast("info", "you left this collab quest");
        return;
      }
      get().setOperationLoading(`complete-${id}`, true);
      completeQuestForAll(quest.id)
        .then(({ quest: updated }) => {
          if (!updated) return;
          set((s) => ({ quests: replaceQuestById(s.quests, updated as Quest) }));
          showToast("success", `quest "${updated.title}" completed`);
        })
        .catch((e) => {
          console.error(e);
          showToast("error", "failed to complete collab quest");
        })
        .finally(() => get().setOperationLoading(`complete-${id}`, false));
      return;
    }
    if(quest.boardId && quest.acceptedByUserId !== me){
      showToast("info", "only whoever accepted this quest can mark it as complete");
      return;
    }

    if (quest.boardId) {
      get().setOperationLoading(`complete-${id}`, true);
      completeSharedQuest(quest.boardId, quest.id)
        .then(({ quest: updated }) => {
          if (!updated) return;
          set((s) => ({ quests: replaceQuestById(s.quests, updated) }));
          showToast("success", `quest "${updated.title}" completed`);
        })
        .catch((e) => {
          console.error(e);
          showToast("error", "failed to complete shared quest");
        })
        .finally(() => get().setOperationLoading(`complete-${id}`, false));
      return;
    }
    get().setOperationLoading(`complete-${id}`, true);
    const now = Date.now();

    try {
      if (isTutorial(quest)) {
        const tid = quest.generationCriteria?.skillTarget;
        if (
          typeof tid === "string" &&
          !useTutorialStore.getState().canCompleteTutorialQuestForTemplate(tid)
        ) {
          showToast(
            "info",
            "finish the highlighted steps for this tutorial before completing the quest",
          );
          return;
        }
        try {
          grantQuestRewards(quest);
          applyTutorialRewards(quest);
          // awardTutorialQuestSkillXP(quest);
        } catch (error) {
          showToast("error", "failed to complete quest");
          devError("quest", "tutorial rewards failed", error);
          return;
        }
      }

      set((state) => {
        const q = state.quests.find((x) => x.id === id);
        if (!q) return state;
        const completed: Quest = {
          ...q,
          status: "completed" as Quest["status"],
          completedAt: now,
          completedByUserId: me ?? quest.completedByUserId,
        };
        if (q.frequency && q.frequency !== "once") {
          completed.isTemplate = true;
          completed.nextDueAt = RecurringQuests.getNextDueDate(
            q.frequency,
            q.createdAt,
            q.customFrequency
          );
        }
        const next: Quest[] = state.quests.map((x) =>
          x.id === id ? completed : x
        );
        scheduleQuestSync();
        return { quests: next };
      });

      if (isTutorial(quest)) {
        return;
      }

      useStreakStore.getState().registerCompletion(new Date());
      grantQuestRewards(quest);
      const quests = get().quests;
      const newlyEarned = getBadges(SYSTEM_BADGES, {
        currentStreakDays: useStreakStore.getState().currentDays,
        quests,
        unlockedBadges: useUserStore.getState().user.badges.unlockedBadges,
        xpEvents: useXPEventStore.getState().getAll(),
      });
      newlyEarned.forEach((badgeId) => useUserStore.getState().unlockBadge(badgeId));
      devLog("quest", "quest completed", { id, title: quest.title });
      devLog("user", `quest completed: "${quest.title}"`);
      onQuestComplete(quest, {
        evidenceStore,
        clusterStore,
        candidateStore,
      });
      if (useNameStore.getState().isNaming) {
        showToast("success", `quest "${quest.title}" completed`);
      }
    } catch (error) {
      showToast("error", "failed to complete quest");
      devError("quest", "quest complete failed", error);
    } finally {
      get().setOperationLoading(`complete-${id}`, false);
    }
  },

  failQuest: (id) => {
    const quest = get().quests.find((q) => q.id === id);
    if (!quest) return;
    if (quest && isTutorial(quest)) return;
    const me = useIdentityStore.getState().userCode;
    if (quest.collabQuest) {
      if (quest.myState !== "active") return;
      giveUpQuest(quest.id)
        .then(() => {
          const now = Date.now();
          set((s) => ({
            quests: replaceQuestById(s.quests, {
              ...quest,
              myState: "left",
              status: "failed",
              completedAt: now,
              failedAt: now,
            } as Quest),
          }));
          showToast("info", "you left this collab quest");
        })
        .catch((e) => {
          console.error(e);
          showToast("error", "failed to leave collab quest");
        });
      return;
    }
    if(quest.boardId && quest.acceptedByUserId !== me){
      showToast("info", "only whoever accepted this quest can give it up");
      return;
    }

    if (quest?.boardId) {
      failSharedQuest(quest.boardId, quest.id)
        .then(({ quest: updated }) => {
          if (!updated) return;
          set((s) => ({ quests: replaceQuestById(s.quests, updated) }));
          showToast("success", `quest "${updated.title}" failed`);
        })
        .catch((e) => {
          console.error(e);
          showToast("error", "failed to fail shared quest");
        });
      return;
    }
    set((state) => {
      const now = Date.now();
      const next: Quest[] = state.quests.map((q) =>
        q.id === id
          ? {
              ...q,
              status: "failed" as Quest["status"],
              completedAt: now,
              failedAt: now,
            }
          : q
      );
      scheduleQuestSync();
      return { quests: next };
    });
    if (quest) devLog("user", `quest failed: "${quest.title}"`);
  },

    duplicateQuest: (id) => {
      const originalQuest = get().quests.find(q => q.id === id);
      if (!originalQuest) return null;
      if (originalQuest.isSystemGenerated) return null;
      if (originalQuest.boardId) return null;
      if (originalQuest.collabQuest) return null;
      if (originalQuest.sentByUserId) return null;

      const duplicatedQuest: Quest = withComputedReward({
        ...originalQuest,
        id: crypto.randomUUID(),
        status: "available",
        createdAt: Date.now(),
        acceptedAt: undefined,
        completedAt: undefined,
        pinned: false,
        isSystemGenerated: false,
        systemType: undefined,
        generationCriteria: undefined,
        expiresAt: undefined,
        expiresAfterDays: undefined,
        sentByUserId: undefined,
        sentByName: undefined,
        sentNote: undefined,
        sentAt: undefined,
        sourceQuestId: undefined,
      });

      set(state => {
        const next = [...state.quests, duplicatedQuest];
        scheduleQuestSync();
        return { quests: next };
      });

      return duplicatedQuest;
    },

  togglePin: (id) =>
    set((state) => {
      const me = useIdentityStore.getState().userCode;
      const q = state.quests.find((x) => x.id === id);
      if(!q || q.status !== "accepted") return state;

      if (q.collabQuest) return state;

      if(isPersonalQuest(q)){
        const newPinned = !q.pinned;
        const order = newPinned
          ? countStripPinned(state.quests, me, id)
          : undefined;
        const next = state.quests.map((x) => 
          x.id === id ? { ...x, pinned: newPinned, order } : x,
        );
        scheduleQuestSync();
        return { quests: next };
      }

      if(!q.boardId || !me || q.acceptedByUserId !== me) return state;

      const wasPinned = q.sharedQuestPins?.[me]?.pinned === true;
      const newPinned = !wasPinned;
      const pins = {...(q.sharedQuestPins ?? {}) };
      if(newPinned){
        pins[me] = {
          pinned: true,
          order: countStripPinned(state.quests, me, id),
        };
      } else {
        delete pins[me];
      }
      const next = state.quests.map((x) => 
        x.id === id ? { ...x, sharedQuestPins: pins } : x,
      );
      // Persist server-side pin state for shared quests.
      void pinSharedQuest(q.boardId, q.id, newPinned).catch((e) => {
        console.error(e);
        showToast("error", "failed to update shared pin");
      });
      return { quests: next };
    }),

    reorderPinned: (questId: string, newIndex: number) => 
      set((state) => {
        const me = useIdentityStore.getState().userCode;
        const strip = state.quests.filter((q) => isOnUserStrip(q, me));
        const sorted = [...strip].sort((a, b) => {
          const oa = isPersonalQuest(a)
            ? (a.order ?? 0)
            : me
              ? (a.sharedQuestPins?.[me]?.order ?? 0)
              : 0;
          const ob = isPersonalQuest(b)
            ? (b.order ?? 0)
            : me
              ? (b.sharedQuestPins?.[me]?.order ?? 0)
              : 0;
          return oa - ob;
        });
        const from = sorted.findIndex((q) => q.id === questId);
        if(from === -1 || from === newIndex) return state;

        const reordered = [...sorted];
        const [moved] = reordered.splice(from, 1);
        reordered.splice(newIndex, 0, moved);

        const orderById = new Map<string, number>();
        reordered.forEach((q, i) => orderById.set(q.id, i));

        const next = state.quests.map((quest) => {
          const ord = orderById.get(quest.id);
          if(ord === undefined) return quest;
          if(isPersonalQuest(quest) && quest.pinned){
            return { ...quest, order: ord };
          }
          if (
            me &&
            quest.boardId &&
            quest.acceptedByUserId === me &&
            quest.sharedQuestPins?.[me]?.pinned
          ){
            const pins = { ...quest.sharedQuestPins };
            pins[me] = { pinned: true, order: ord };
            return { ...quest, sharedQuestPins: pins };
          }
          return quest;
        });
      // Persist shared pin ordering server-side for this user (per board).
      if (me) {
        const sharedPinnedIds = reordered
          .filter((q) => !isPersonalQuest(q) && !q.collabQuest)
          .map((q) => q.id);
        if (sharedPinnedIds.length > 0) {
          const boardId = reordered.find((q) => q.boardId)?.boardId;
          if (boardId) {
            void reorderSharedPins(boardId, sharedPinnedIds)
              .then(({ quests }) => {
                if (!quests || quests.length === 0) return;
                set((s) => {
                  let list = s.quests;
                  for (const uq of quests) list = replaceQuestById(list, uq);
                  return { quests: list };
                });
              })
              .catch((e) => {
                console.error(e);
                showToast("error", "failed to reorder shared pins");
              });
          }
        }
      }
        return { quests: next };
      }),

  toggleSubquest: (questId, subquestId) => {
    const quest = get().quests.find((q) => q.id === questId);
    if (!quest?.subquests) return;

    if (quest.collabQuest) {
      if (quest.myState !== "active" || quest.status !== "accepted") return;
      const sub = quest.subquests.find((s) => s.id === subquestId);
      if (!sub) return;
      const nextCompleted = !sub.completed;
      get().setOperationLoading(`sub-${questId}-${subquestId}`, true);
      toggleQuestSubquest({
        questId: quest.id,
        subquestId,
        completed: nextCompleted,
      })
        .then(({ quest: updated }) => {
          if (!updated) return;
          set((s) => ({
            quests: replaceQuestById(s.quests, updated as Quest),
          }));
        })
        .catch((e) => {
          console.error(e);
          showToast("error", "failed to update subquest");
        })
        .finally(() =>
          get().setOperationLoading(`sub-${questId}-${subquestId}`, false),
        );
      return;
    }

    if (quest.boardId) {
      if (quest.status !== "accepted") return;
      const me = useIdentityStore.getState().userCode;
      if (quest.acceptedByUserId && quest.acceptedByUserId !== me) return;
      const sub = quest.subquests.find((s) => s.id === subquestId);
      if (!sub) return;
      const nextCompleted = !sub.completed;
      const updatedSubquests = quest.subquests.map((s) =>
        s.id === subquestId ? { ...s, completed: nextCompleted } : s,
      );
      get().setOperationLoading(`sub-${questId}-${subquestId}`, true);
      patchBoardQuest(quest.boardId, quest.id, { subquests: updatedSubquests })
        .then((updated) => {
          set((s) => ({
            quests: replaceQuestById(s.quests, updated),
          }));
        })
        .catch((e) => {
          console.error(e);
          showToast("error", "failed to update subquest");
        })
        .finally(() =>
          get().setOperationLoading(`sub-${questId}-${subquestId}`, false),
        );
      return;
    }

    set((state) => {
      const q = state.quests.find((qq) => qq.id === questId);
      const me = useIdentityStore.getState().userCode;
      if (q?.acceptedByUserId && q.acceptedByUserId !== me) return state;
      if (!q || !q.subquests) return state;
      const updatedSubquests = q.subquests.map((sub) =>
        sub.id === subquestId ? { ...sub, completed: !sub.completed } : sub,
      );
      const updatedQuest = { ...q, subquests: updatedSubquests };
      const next = state.quests.map((qq) =>
        qq.id === questId ? updatedQuest : qq,
      );
      scheduleQuestSync();
      return { quests: next };
    });
  },

  processRecurrence: () => {
    const state = get();
    const dueQuests = state.quests.filter(q =>
      RecurringQuests.shouldGenerateNext(q)
    );
    if (dueQuests.length === 0) return;
    const newQuests = dueQuests.map((template) =>
      withComputedReward(RecurringQuests.generateNextInstance(template))
    );
    const updatedCompletedQuests = dueQuests.map(quest => ({
      ...quest,
      nextDueAt: Number.POSITIVE_INFINITY,
    }));
    const allQuests = [
      ...state.quests.filter(q => !dueQuests.some(cq => cq.id === q.id)),
      ...updatedCompletedQuests,
      ...newQuests,
    ];
    get().setQuest(allQuests);
  },

  createRecurrence: (input) => {
    const now = Date.now();
    const template: Quest = {
      ...input,
      id: crypto.randomUUID(),
      status: 'available',
      createdAt: now,
      isTemplate: true,
      nextDueAt: RecurringQuests.getNextDueDate(
        input.frequency!,
        now,
        input.customFrequency
      ),
    };

    set((state) => {
      const next = [...state.quests, template];
      scheduleQuestSync();
      return { quests: next };
    });

    return template;
  },

  updateRecurrence: (templateId: string, updates: Partial<Quest>) => {
    set((state) => {
      const template = state.quests.find((q) => q.id === templateId);
      if (!template || !template.isTemplate) return state;
      const mergedTemplate = { ...template, ...updates } as Quest;
      const updatedTemplate = withComputedReward(mergedTemplate);
      const updatedQuests = state.quests.map((q) => {
        if (q.parentQuestId === templateId && q.status === "available") {
          return withComputedReward({ ...q, ...updates } as Quest);
        }
        return q.id === templateId ? updatedTemplate : q;
      });
      scheduleQuestSync();
      return { quests: updatedQuests };
    });
  },

  pauseRecurrence: (templateId: string) => {
    set(state => {
      const quest = state.quests.find(q => q.id === templateId);
      if (!quest) return state;
      const next = state.quests.map(q => {
        const isTemplate = q.id === templateId;
        const isAvailableInstance =
          q.parentQuestId === templateId && q.status === "available";
        if (!isTemplate && !isAvailableInstance) return q;
        return { ...q, paused: true };
      });
      scheduleQuestSync();
      return { quests: next };
    });
  },
  resumeRecurrence: (templateId: string) => {
    set(state => {
      const quest = state.quests.find(q => q.id === templateId);
      if (!quest) return state;
      const next = state.quests.map(q => {
        const isTemplate = q.id === templateId;
        const isAvailableInstance =
          q.parentQuestId === templateId && q.status === "available";
        if (!isTemplate && !isAvailableInstance) return q;
        return { ...q, paused: false };
      });
      scheduleQuestSync();
      return { quests: next };
    });
  },

  processAutoFail: () => {
    if (!useSettingsStore.getState().autoFailOverdueQuests) return;
    const state = get();
    const now = Date.now();
    const overdueAccepted = state.quests.filter(
      (q) =>
        q.status === "accepted" &&
        isQuestOverdue(q) &&
        !isTutorial(q) &&
        isPersonalQuest(q) &&
        !q.collabQuest,
    );
    if (overdueAccepted.length === 0) return;
    const next = state.quests.map(q => {
      if (!overdueAccepted.some(o => o.id === q.id)) return q;
      return {
        ...q,
        status: "failed" as Quest["status"],
        completedAt: now,
        failedAt: now,
      };
    });
    get().setQuest(next);
  },
  
  getAvailable: () =>
    get().quests.filter((q) => q.status === "available" && isPersonalQuest(q)),

  getAccepted: () =>
    get().quests.filter(
      (q) =>
        q.status === "accepted" &&
        (isPersonalQuest(q) || isQuestCollab(q)),
    ),

  getPinned: () => {
    const me = useIdentityStore.getState().userCode;
    return get().quests.filter((q) => {
      if(q.status !== "accepted") return false;
      if(isPersonalQuest(q)) return q.pinned === true;
      if(!me || !q.boardId) return false;
      return q.sharedQuestPins?.[me]?.pinned === true;
    });
  },

  getQuestById: (id) => 
    get().quests.find((q) => q.id === id),

}));

export const questStore = useQuestStore;