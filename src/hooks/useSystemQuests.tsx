import { useEffect } from "react";
import { useQuestStore } from "../store/quest";
import { SystemQuestGenerator } from "../store/system";

export type UseSystemQuestsOptions = {
  bootstrapSettled?: boolean;
};

export function useSystemQuests(options?: UseSystemQuestsOptions) {
  const bootstrapSettled = options?.bootstrapSettled ?? true;
  const quests = useQuestStore((s) => s.quests);
  const setQuest = useQuestStore((s) => s.setQuest);

  useEffect(() => {
    if(!bootstrapSettled) return;

    const systemQuests = quests.filter((q) => q.isSystemGenerated);
    const seasonalQuest = SystemQuestGenerator.generateSeasonalQuest();
    if (seasonalQuest) {
      const questExists = systemQuests.some(
        (q) =>
          q.systemType === "seasonal" &&
          q.generationCriteria?.season === seasonalQuest.generationCriteria?.season
      );
      if (!questExists) {
        setQuest([...quests, seasonalQuest]);
      }
    }
  }, [quests, setQuest, bootstrapSettled]);
}