import { create } from "zustand";
import type { SharedBoard } from "@/types/board";

type BoardState = {
  boards: SharedBoard[];
  activeBoardId: string | null;
  setBoards: (boards: SharedBoard[]) => void;
  setActiveBoardId: (id: string | null) => void;
  upsertBoard: (board: SharedBoard) => void;
};

export const useBoardStore = create<BoardState>((set, get) => ({
  boards: [],
  activeBoardId: null,

  setBoards: (boards) => {
    const next = boards.slice();
    set({
      boards: next,
      activeBoardId: 
        get().activeBoardId && next.some((b) => b.id === get().activeBoardId)
        ? get().activeBoardId
        : next[0]?.id ?? null,
    });
  },

  setActiveBoardId: (id) => set({ activeBoardId: id }),

  upsertBoard: (board) =>
    set((s) => {
      const i = s.boards.findIndex((b) => b.id === board.id);
      const next =
        i === -1 ? [...s.boards, board] : s.boards.map((b, j) => (j === i ? board : b));
      return{
        boards: next,
        activeBoardId: s.activeBoardId ?? board.id
      };
    }),

    
}));