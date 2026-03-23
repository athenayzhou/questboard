import { create } from "zustand";
import type { SettingsPersisted } from "@/types/clientExtension";

type State = SettingsPersisted & {
  setAutoNameSkills: (v: boolean) => void;
  setAutoFailOverdueQuests: (v: boolean) => void;
  hydrate: (partial: Partial<SettingsPersisted>) => void;
};

function touchExtension() {
  void import("@/lib/apiExtension").then((m) => m.scheduleExtensionSync());
}

export const useSettingsStore = create<State>((set) => ({
  autoNameSkills: true,
  autoFailOverdueQuests: false,

  setAutoNameSkills: (autoNameSkills) => {
    set({ autoNameSkills });
    touchExtension();
  },

  setAutoFailOverdueQuests: (autoFailOverdueQuests) => {
    set({ autoFailOverdueQuests });
    touchExtension();
  },

  hydrate: (partial) =>
    set((s) => ({
      autoNameSkills:
        partial.autoNameSkills ?? s.autoNameSkills,
      autoFailOverdueQuests:
        partial.autoFailOverdueQuests ?? s.autoFailOverdueQuests,
    })),
}));
