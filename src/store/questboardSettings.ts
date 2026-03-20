import { create } from "zustand";
import type { QuestboardSettingsPersisted } from "@/types/clientExtension";

type State = QuestboardSettingsPersisted & {
  setAutoNameSkills: (v: boolean) => void;
  setAutoFailOverdueQuests: (v: boolean) => void;
  hydrate: (partial: Partial<QuestboardSettingsPersisted>) => void;
};

function touchExtension() {
  void import("@/lib/apiExtension").then((m) => m.scheduleExtensionSync());
}

export const useQuestboardSettings = create<State>((set) => ({
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
