import { create } from "zustand";
import { devLog } from "../dev/devLogs";

type StreakInfo = {
  current: number;
  lastDate: string;
};

type StreakState = {
  currentDays: number;
  lastCompletion: string;
  registerCompletion: (now: Date) => boolean;
  getInfo: () => StreakInfo;
  hydrate: (partial: { currentDays: number; lastCompletion: string }) => void;
};

function touchExtension() {
  void import("@/lib/apiExtension").then((m) => m.scheduleExtensionSync());
}

function toDateString(d: Date): string {
  return d.toISOString().split("T")[0];
}

function daysBetween(a: string, b: string): number {
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

export const useStreakStore = create<StreakState>((set, get) => ({
  currentDays: 0,
  lastCompletion: "",

  hydrate: (partial) =>
    set({
      currentDays: partial.currentDays ?? 0,
      lastCompletion: partial.lastCompletion ?? "",
    }),

  registerCompletion: (now: Date) => {
    const today = toDateString(now);
    const last = get().lastCompletion;
    let extended = false;

    if (last === today) {
      devLog("streak", "streak: already counted today", { today });
    } else if (last && daysBetween(last, today) === 1) {
      set((state) => {
        const next = {
          currentDays: state.currentDays + 1,
          lastCompletion: today,
        };
        touchExtension();
        devLog("streak", `streak extended: ${next.currentDays} days`, { last, today });
        return next;
      });
      extended = true;
    } else {
      set(() => {
        const next = {
          currentDays: 1,
          lastCompletion: today,
        };
        touchExtension();
        devLog(
          "streak",
          last ? "streak reset: 1 day (gap)" : "streak started: 1 day",
          { today },
        );
        return next;
      });
    }

    return extended;
  },

  getInfo: () => ({
    current: get().currentDays,
    lastDate: get().lastCompletion,
  }),
}));
