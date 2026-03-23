import { useEffect } from "react";
import { useQuestStore } from "../store/quest";
import { SystemQuestGenerator } from "../store/system";

export type UseSystemQuestsOptions = {
  bootstrapSettled?: boolean;
};

export function useSystemQuests(options?: UseSystemQuestsOptions) {
  const bootstrapSettled = options?.bootstrapSettled ?? true;
  const setQuest = useQuestStore((s) => s.setQuest);

  useEffect(() => {
    if (!bootstrapSettled) return;

    setQuest((prev) => {
      const systemQuests = prev.filter((q) => q.isSystemGenerated);
      const seasonalQuest = SystemQuestGenerator.generateSeasonalQuest();
      if (seasonalQuest) {
        const questExists = systemQuests.some(
          (q) =>
            q.systemType === "seasonal" &&
            q.generationCriteria?.season ===
              seasonalQuest.generationCriteria?.season,
        );
        if (!questExists) {
          return [...prev, seasonalQuest];
        }
      }
      return prev;
    });
  }, [setQuest, bootstrapSettled]);
}