import { create } from "zustand";

type IdentityState = {
  playerCode: string | null;
  setPlayerCode: (code: string | null) => void;
  reset: () => void;
};

export const useIdentityStore = create<IdentityState>((set) => ({
  playerCode: null,
  setPlayerCode: (playerCode) => set({ playerCode }),
  reset: () => set({ playerCode: null }),
}))