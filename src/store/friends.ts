import { create } from "zustand";
import type { Friend, FriendStatus } from "../types/friend";

function touchExtension() {
  void import("@/lib/apiExtension").then((m) => m.scheduleExtensionSync());
}

type FriendsState = {
  friends: Friend[];
  addFriend: (friend: Friend) => void;
  updateStatus: (id: string, status: FriendStatus) => void;
  removeFriend: (id: string) => void;
  hydrate: (friends: Friend[]) => void;
};

export const useFriendsStore = create<FriendsState>((set) => ({
  friends: [],

  hydrate: (friends) => set({ friends: Array.isArray(friends) ? friends : [] }),

  addFriend: (friend) =>
    set((state) => {
      const next = [...state.friends, friend];
      touchExtension();
      return { friends: next };
    }),

  updateStatus: (id, status) =>
    set((state) => {
      const next = state.friends.map((f) =>
        f.id === id ? { ...f, status } : f,
      );
      touchExtension();
      return { friends: next };
    }),

  removeFriend: (id) =>
    set((state) => {
      const next = state.friends.filter((f) => f.id !== id);
      touchExtension();
      return { friends: next };
    }),
}));

export const friendsStore = useFriendsStore;
