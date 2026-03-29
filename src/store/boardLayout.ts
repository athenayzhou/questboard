import { create } from "zustand";
import type { BoardLayoutMap } from "@/types/boardLayout";

type BoardLayoutState = {
  /** Server-hydrated + in-session saves; keyed by full surface key (see boardLayoutStorageKey). */
  layouts: Record<string, BoardLayoutMap>;
  setLayout: (surfaceKey: string, layout: BoardLayoutMap) => void;
  hydrateLayouts: (fromServer: Record<string, BoardLayoutMap>) => void;
  reset: () => void;
};

export const useBoardLayoutStore = create<BoardLayoutState>((set) => ({
  layouts: {},

  setLayout: (surfaceKey, layout) =>
    set((s) => ({
      layouts: { ...s.layouts, [surfaceKey]: layout },
    })),

  hydrateLayouts: (fromServer) =>
    set((s) => ({
      layouts: { ...s.layouts, ...fromServer },
    })),

  reset: () => set({ layouts: {} }),
}));
