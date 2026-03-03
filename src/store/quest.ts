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
  togglePin: (id: string) => void;

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
        // ignore persistence failures
      }
      return { quests: next, isCreating: false } as any;
    });

    return quest;
  },

  acceptQuest: (id) => 
    set((state) => {
      const next = state.quests.map(q =>
        q.id === id 
          ? {...q, status: "accepted", acceptedAt: Date.now() } 
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
      const next = state.quests.map(q => 
        q.id === id
          ? {...q, status: "completed", completedAt: Date.now()}
          : q
      );
      try {
        localStorage.setItem("quests", JSON.stringify(next));
      } catch {
        // ignore persistence failures
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
      const next = state.quests.map(q =>
        q.id === id
          ? { 
              ...q, 
              status: "failed", 
              completedAt: now,
              failedAt: now,
            }
          : q
      );
      try {
        localStorage.setItem("quests", JSON.stringify(next));
      } catch {
        // ignore persistence failures
      }
      return { quests: next };
    }),

  togglePin: (id) =>
    set((state) => {
      const next = state.quests.map((q) =>
        q.id === id ? { ...q, pinned: !q.pinned } : q
      );
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
    get().quests.filter(
      (q) => q.status === "accepted" && q.pinned
    ),

  getQuestById: (id) => 
    get().quests.find((q) => q.id === id),

}));

export const questStore = useQuestStore;