import { create } from "zustand";

type OverlayType = "profile"|"quests"|"log"|"friends"|"skills"|"settings"|null

type OverlayState = {
  activeOverlay: OverlayType;
  selectedQuestId: string | null;
  openOverlay: (type: OverlayType) => void;
  closeOverlay: () => void;
  selectQuest: (id:string | null) => void;
}

export const useOverlay = create<OverlayState>((set) => ({
  activeOverlay: null,
  selectedQuestId: null,
  openOverlay: (type) => set({ activeOverlay: type }),
  closeOverlay: () => set({ activeOverlay: null }),
  selectQuest: (id) => set({ selectedQuestId: id }),
}))