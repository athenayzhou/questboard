import { create } from "zustand";
import type { Quest } from "../types/quest";
import { onQuestComplete } from "../hooks/onQuestComplete";
import { evidenceStore, candidateStore, clusterStore } from './bundledStores';

type QuestState = {
  quests: Quest[];
  setQuest: (q: Quest[]) => void;

  addQuest: (
    input: Omit<Quest, "id" | "status" | "createdAt">
  ) => Quest;
  acceptQuest: (id: string) => void;
  completeQuest: (id: string) => void;
  failQuest: (id: string) => void;
  duplicateQuest: (id: string) => Quest | null;
  togglePin: (id: string) => void;
  reorderPinnedQuests: (questId: string, newIndex: number) => void;

  getAvailable: () => Quest[];
  getAccepted: () => Quest[];
  getPinned: () => Quest[];
  getQuestById: (id: string) => Quest | undefined;
}

export const useQuestStore = create<QuestState>((set, get) => ({
  quests: (() => {
    try {
      const raw = localStorage.getItem("quests");
      return raw ? (JSON.parse(raw) as Quest[]) : [];
    } catch {
      return [];
    }
  })(),
  setQuest: (quests) => {
    try {
      localStorage.setItem("quests", JSON.stringify(quests));
    } catch {
    }
    set({ quests });
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
      try {
        localStorage.setItem("quests", JSON.stringify(next));
      } catch {
      }
      return { quests: next, isCreating: false } as any;
    });

    return quest;
  },

  acceptQuest: (id) => 
    set((state) => {
      const next: Quest[] = state.quests.map(q =>
        q.id === id 
          ? {
              ...q, 
              status: "accepted" as Quest["status"], 
              acceptedAt: Date.now() } 
          : q
      );
      try {
        localStorage.setItem("quests", JSON.stringify(next));
      } catch {
      }
      return { quests: next };
    }),

  completeQuest: (id: string) => {
    const quest = get().quests.find(q => q.id === id);
    if (!quest || quest.status !== "accepted") return;

    set(state => {
      const next: Quest[] = state.quests.map(q => 
        q.id === id
          ? {
              ...q, 
              status: "completed" as Quest["status"], 
              completedAt: Date.now()}
          : q
      );
      try {
        localStorage.setItem("quests", JSON.stringify(next));
      } catch {
      }
      return { quests: next };
    });

    onQuestComplete(quest, {
      evidenceStore,
      clusterStore,
      candidateStore,
    });
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
      try {
        localStorage.setItem("quests", JSON.stringify(next));
      } catch {
      }
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
      }

      set(state => ({
        quests: [...state.quests, duplicatedQuest],
      }));

      try {
        const current = JSON.parse(localStorage.getItem("quests") || "[]");
        localStorage.setItem("quests", JSON.stringify([...current, duplicatedQuest]));
      } catch {
      }
      return duplicatedQuest;
    },

  togglePin: (id) =>
    set((state) => {
      const pinnedCount = state.quests.filter(
        (q) => q.status === "accepted" && q.pinned
      ).length;
      const next = state.quests.map((q) => {
        if (q.id !== id) return q;
        const nowPinned = !q.pinned;
        return {
          ...q,
          pinned: nowPinned,
          order: nowPinned ? pinnedCount : undefined,
        };
      });
      try {
        localStorage.setItem("quests", JSON.stringify(next));
      } catch {
      }
      return { quests: next };
    }),

  reorderPinnedQuests: (questId, newIndex) =>
    set((state) => {
      const pinned = state.quests
        .filter((q) => q.status === "accepted" && q.pinned)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      const fromIndex = pinned.findIndex((q) => q.id === questId);
      if (fromIndex === -1 || fromIndex === newIndex) return state;
      const reordered = [...pinned];
      const [moved] = reordered.splice(fromIndex, 1);
      reordered.splice(newIndex, 0, moved);
      const orderById = new Map(reordered.map((q, i) => [q.id, i]));
      const next = state.quests.map((q) => {
        const o = orderById.get(q.id);
        return o !== undefined ? { ...q, order: o } : q;
      });
      try {
        localStorage.setItem("quests", JSON.stringify(next));
      } catch {
      }
      return { quests: next };
    }),

  getAvailable: () =>
    get().quests.filter((q) => q.status === "available"),

  getAccepted: () =>
    get().quests.filter((q) => q.status === "accepted"),

  getPinned: () =>
    get()
      .quests.filter((q) => q.status === "accepted" && q.pinned)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),

  getQuestById: (id) => 
    get().quests.find((q) => q.id === id),

}));

export const questStore = useQuestStore;