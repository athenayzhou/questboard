import { create } from "zustand";

type OverlayType = "profile"|"quests"|"log"|"friends"|"skills"|"settings"|null

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
  // selectedQuestId: string | null;
  // selectQuest: (id:string | null) => void;
  openQuestPages: QuestPage[];
  openQuest: (id: string) => void;
  closeQuest: (id: string) => void;
  bringToFront: (id: string) => void;
  moveQuest: (id: string, x: number, y: number) => void;
}

export const useOverlay = create<OverlayState>((set, get) => ({
  activeOverlay: null,
  openOverlay: (type) => set({ activeOverlay: type }),
  closeOverlay: () => set({ activeOverlay: null }),
  // selectedQuestId: null,
  // selectQuest: (id) => set({ selectedQuestId: id }),
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
    }))
}))