import { useEffect } from "react";
import { useQuestStore } from "../store/quest";
import { SystemQuestGenerator } from "../store/system";

export function useSystemQuests() {
  const quests = useQuestStore((s) => s.quests);
  const setQuest = useQuestStore((s) => s.setQuest);

  useEffect(() => {
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
  }, [quests, setQuest]);
}