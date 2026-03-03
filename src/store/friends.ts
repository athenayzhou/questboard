import { create } from "zustand";
import type { Friend, FriendStatus } from "../types/friend";

type FriendsState = {
  friends: Friend[];
  addFriend: (friend: Friend) => void;
  updateStatus: (id: string, status: FriendStatus) => void;
  removeFriend: (id: string) => void;
};

export const useFriendsStore = create<FriendsState>((set) => ({
  friends: (() => {
    try {
      const raw = localStorage.getItem("friends");
      return raw ? (JSON.parse(raw) as Friend[]) : [];
    } catch {
      return [];
    }
  })(),

  addFriend: (friend) =>
    set((state) => {
      const next = [...state.friends, friend];
      try {
        localStorage.setItem("friends", JSON.stringify(next));
      } catch {
      }
      return { friends: next };
    }),

  updateStatus: (id, status) =>
    set((state) => {
      const next = state.friends.map((f) =>
        f.id === id ? { ...f, status } : f
      );
      try {
        localStorage.setItem("friends", JSON.stringify(next));
      } catch {
      }
      return { friends: next };
    }),

  removeFriend: (id) =>
    set((state) => {
      const next = state.friends.filter((f) => f.id !== id);
      try {
        localStorage.setItem("friends", JSON.stringify(next));
      } catch {
      }
      return { friends: next };
    }),
}));


export const friendsStore = useFriendsStore;