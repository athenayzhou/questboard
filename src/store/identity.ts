import { create } from "zustand";

type IdentityState = {
  userCode: string | null;
  setUserCode: (code: string | null) => void;
  reset: () => void;
};

export const useIdentityStore = create<IdentityState>((set) => ({
  userCode: null,
  setUserCode: (userCode) => set({ userCode }),
  reset: () => set({ userCode: null }),
}))