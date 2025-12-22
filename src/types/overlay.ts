import { create } from "zustand"

type OverlayType = "profile"|"quests"|"friends"|"skills"|"settings"|null

type OverlayState = {
  activeOverlay: OverlayType
  openOverlay: (type: OverlayType) => void
  closeOverlay: () => void
}

export const useOverlay = create<OverlayState>((set) => ({
  activeOverlay: null,
  openOverlay: (type) => set({ activeOverlay: type }),
  closeOverlay: () => set({ activeOverlay: null }),
}))