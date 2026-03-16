import { create } from "zustand";
import type { Quest } from "../types/quest";
import { onQuestComplete } from "../hooks/onQuestComplete";
import { evidenceStore, candidateStore, clusterStore } from './bundledStores';
import { showToast } from "../utils/toastAPI";

import { devLog, devError } from "../dev/devLogs";
import { RecurringQuests } from "../utils/recurrence";
import { isQuestOverdue } from "../utils/recurrence";

type QuestState = {
  quests: Quest[];

  isLoading: boolean;
  operationLoading: Record<string, boolean>;
  setLoading: (loading: boolean) => void;
  setOperationLoading: (operation: string, loading: boolean) => void;

  setQuest: (q: Quest[]) => void;
  addQuest: (
    input: Omit<Quest, "id" | "status" | "createdAt">
  ) => Quest;
  editQuest: (id: string, updates: Partial<Omit<Quest, "id"|"status"|"createdAt">>) => void;
  acceptQuest: (id: string) => void;
  completeQuest: (id: string) => void;
  failQuest: (id: string) => void;
  duplicateQuest: (id: string) => Quest | null;

  togglePin: (id: string) => void;
  reorderPinned: (questId: string, newIndex: number) => void;
  toggleSubquest: (questId: string, subquestId: string) => void;

  processRecurrence: () => void;
  createRecurrence: (quest: Omit<Quest, 'id'|'status'|'createdAt'>) => Quest;
  updateRecurrence: (templateId: string, updates: Partial<Quest>) => void;
  pauseRecurrence: (templateId: string) => void;
  resumeRecurrence: (templateId: string) => void;
  processAutoFail: () => void;

  getAvailable: () => Quest[];
  getAccepted: () => Quest[];
  getPinned: () => Quest[];
  getQuestById: (id: string) => Quest | undefined;
}

const syncToStorage = (quests: Quest[]):boolean => {
  try {
    localStorage.setItem("quests", JSON.stringify(quests));
    return true;
  } catch (error) {
    devError('storage', 'quest sync failed', error)
    return false;
  }
};

export const useQuestStore = create<QuestState>((set, get) => ({
  quests: (() => {
    try {
      const raw = localStorage.getItem("quests");
      return raw ? (JSON.parse(raw) as Quest[]) : [];
    } catch {
      return [];
    }
  })(),

  isLoading: false,
  operationLoading: {},
  setLoading: (loading) => set({ isLoading: loading }),
  setOperationLoading: (operation, loading) => set((state) => ({
    operationLoading: { ...state.operationLoading, [operation]: loading }
  })),

  setQuest: (quests) => {
    const success = syncToStorage(quests);
    set({ quests });
    if(!success){
      showToast('error', 'failed to save quests');
    }
  },

  addQuest: (input) => {
    const quest: Quest = {
      ...input,
      id: crypto.randomUUID(),
      status: "available",
      createdAt: Date.now(),
      pinned: false,
    };

    set((state) => {
      const next = [...state.quests, quest];
      const success = syncToStorage(next);
      if(!success){
        showToast('error', 'failed to add quest');
      }
      return { quests: next };
    });

    return quest;
  },

  editQuest: (id, updates) => {
    set(state => {
      const quest = state.quests.find(q => q.id === id);
      if(!quest || quest.status !== "available") return state;

      const updatedQuest = {...quest, ...updates };
      const next = state.quests.map(q => q.id === id ? updatedQuest: q);
      syncToStorage(next);
      return { quests: next };
    })
  },

  acceptQuest: (id) => {
    const quest = get().quests.find(q => q.id === id);
    set((state) => {
      const next: Quest[] = state.quests.map(q =>
        q.id === id 
          ? {
              ...q, 
              status: "accepted" as Quest["status"], 
              acceptedAt: Date.now() } 
          : q
      );
      syncToStorage(next);
      return { quests: next };
    })
    if (quest) {
      showToast('success', `quest "${quest.title}" accepted`);
      devLog('quest', 'quest accepted', { id, title: quest?.title })
    }
  },

  completeQuest: (id: string) => {
    const quest = get().quests.find(q => q.id === id);
    if (!quest || quest.status !== "accepted") return;
    get().setOperationLoading(`complete-${id}`, true);

    const now = Date.now();

    try {
      set(state => {
        const q = state.quests.find(x => x.id === id);
        if (!q) return state;
        const completed: Quest = {
          ...q,
          status: "completed" as Quest["status"],
          completedAt: now,
        };
        if (q.frequency && q.frequency !== "once") {
          completed.isTemplate = true;
          completed.nextDueAt = RecurringQuests.getNextDueDate(
            q.frequency,
            q.createdAt,
            q.customFrequency
          );
        }
        const next: Quest[] = state.quests.map(x =>
          x.id === id ? completed : x
        );
        syncToStorage(next);
        return { quests: next };
      });
      showToast('success', `quest "${quest.title}" completed`);
      devLog('quest', 'quest completed', { id, title: quest.title });
      onQuestComplete(quest, {
        evidenceStore,
        clusterStore,
        candidateStore,
      });
    } catch (error) {
      showToast('error', `failed to complete quest`);
      devError('quest', 'quest complete failed', error);
    } finally {
      get().setOperationLoading(`complete-${id}`, false);
    }
  },

  failQuest: (id) => 
    set(state => {
      const now = Date.now();
      const next: Quest[] = state.quests.map(q =>
        q.id === id
          ? { 
              ...q, 
              status: "failed" as Quest["status"], 
              completedAt: now,
              failedAt: now,
            }
          : q
      );
      syncToStorage(next);
      return { quests: next };
    }),

    duplicateQuest: (id) => {
      const originalQuest = get().quests.find(q => q.id === id);
      if (!originalQuest) return null;

      const duplicatedQuest: Quest = {
        ...originalQuest,
        id: crypto.randomUUID(),
        status: "available",
        createdAt: Date.now(),
        acceptedAt: undefined,
        completedAt: undefined,
        pinned: false,
      };

      set(state => {
        const next = [...state.quests, duplicatedQuest];
        const success = syncToStorage(next);
        if(!success){
          showToast('error', 'failed to add quest');
        }
        return { quests: next };
      });

      return duplicatedQuest;
    },

  togglePin: (id) =>
    set((state) => {
      const pinnedQuests = state.quests.filter(q => q.status === "accepted" && q.pinned);
      const next = state.quests.map((q) => {
        if(q.id === id){
          const newPinned = !q.pinned;
          return {
            ...q,
            pinned: newPinned,
            order: newPinned ? (pinnedQuests.length) : undefined
          };
        }
        return q;
    });
      syncToStorage(next);
      return { quests: next };
    }),

    reorderPinned: (questId: string, newIndex: number) => 
      set((state) => {
        const pinnedQuests = state.quests.filter(q => q.status === "accepted" && q.pinned);
        const questIndex = pinnedQuests.findIndex(q => q.id === questId);

        if (questIndex === -1 || questIndex === newIndex) return state;

        const reorderedPinned = [...pinnedQuests];
        const [movedQuest] = reorderedPinned.splice(questIndex, 1);
        reorderedPinned.splice(newIndex, 0, movedQuest);

        const updatedQuests = state.quests.map(quest => {
          if(quest.status === "accepted" && quest.pinned) {
            const newOrderIndex = reorderedPinned.findIndex(q => q.id === quest.id);
            return {...quest, order: newOrderIndex };
          }
          return quest;
        });
        syncToStorage(updatedQuests);
        return { quests: updatedQuests }
      }),

  toggleSubquest: (questId, subquestId) => {
    set(state => {
      const quest = state.quests.find(q => q.id === questId);
      if(!quest || !quest.subquests) return state;
      const updatedSubquests = quest.subquests.map(sub => 
        sub.id === subquestId ? { ...sub, completed: !sub.completed } : sub
      );
      const updatedQuest = { ...quest, subquests: updatedSubquests };
      const next = state.quests.map(q => q.id === questId ? updatedQuest : q);
      syncToStorage(next);
      return { quests: next };
    });
  },

  processRecurrence: () => {
    const state = get();
    const dueQuests = state.quests.filter(q =>
      RecurringQuests.shouldGenerateNext(q)
    );
    if (dueQuests.length === 0) return;
    const newQuests = dueQuests.map(template =>
      RecurringQuests.generateNextInstance(template)
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
      syncToStorage(next);
      return { quests: next };
    });

    return template;
  },

  updateRecurrence: (templateId: string, updates: Partial<Quest>) => {
    set(state => {
      const template = state.quests.find(q => q.id === templateId);
      if(!template || !template.isTemplate) return state;
      const updatedTemplate = {...template, ... updates};
      const updatedQuests = state.quests.map(q => {
        if(q.parentQuestId === templateId && q.status === 'available') {
          return {...q, ...updates };
        }
        return q.id === templateId ? updatedTemplate : q;
      });
      syncToStorage(updatedQuests);
      return { quests: updatedQuests }
    });
  },

  pauseRecurrence: (templateId: string) => {
    set(state => {
      const quest = state.quests.find(q => q.id === templateId);
      if (!quest) return state;
      const next = state.quests.map(q =>
        q.id === templateId ? { ...q, paused: true } : q
      );
      syncToStorage(next);
      return { quests: next };
    });
  },
  resumeRecurrence: (templateId: string) => {
    set(state => {
      const quest = state.quests.find(q => q.id === templateId);
      if (!quest) return state;
      const next = state.quests.map(q =>
        q.id === templateId ? { ...q, paused: false } : q
      );
      syncToStorage(next);
      return { quests: next };
    });
  },

  processAutoFail: () => {
    if (localStorage.getItem("autoFailOverdueQuests") !== "true") return;
    const state = get();
    const now = Date.now();
    const overdueAccepted = state.quests.filter(
      q => (q.status === "accepted" || q.status === "available") && isQuestOverdue(q)
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
    get().quests.filter((q) => q.status === "available"),

  getAccepted: () => 
    get().quests.filter((q) => q.status === "accepted"),

  getPinned: () =>
    get().quests.filter(
      (q) => q.status === "accepted" && q.pinned
    ),

  getQuestById: (id) => 
    get().quests.find((q) => q.id === id),

}));

export const questStore = useQuestStore;