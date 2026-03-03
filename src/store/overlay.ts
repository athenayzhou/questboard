import { create } from "zustand";

type OverlayType = "profile"|"quests"|"logs"|"friends"|"skills"|"settings"|"addQuest" | null

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

}

export const useOverlay = create<OverlayState>((set) => ({
  activeOverlay: null,
  openOverlay: (type) => 
    set(() => ({ 
      activeOverlay: type, 
      openQuestPages: []
    })),
  closeOverlay: () => 
    set((s) => ({
      activeOverlay: null,
      openQuestPages: s.activeOverlay === "quests" ? [] : s.openQuestPages,
    })),
  
  openQuestPages: [],
  openQuest: (id) => 
    set((s) => {
      if(s.openQuestPages.some((q) => q.id === id)) return s;
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
    }),

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

}));