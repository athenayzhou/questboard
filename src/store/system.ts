import type { Quest } from "../types/quest";
import {
  SYSTEM_QUESTS,
  type SystemQuestTemplate,
  isDateInRange,
} from "../data/systemQuests";

export class SystemQuestGenerator {
  static generateSystemQuest(template: SystemQuestTemplate): Quest {
    const now = Date.now();
    return {
      id: `${template.id}-${now}`,
      title: template.title,
      description: template.description,
      category: template.category,
      difficulty: template.difficulty,
      reward: template.reward,
      status: "available",
      createdAt: now,
      isSystemGenerated: true,
      systemType: template.systemType,
      generationCriteria: template.generationCriteria,
      expiresAt: template.expiresAfterDays
        ? now + template.expiresAfterDays * 24 * 60 * 60 * 1000
        : undefined,
    };
  }

  static generateSeasonalQuest(): Quest | null {
    const now = new Date();
    const templates = SYSTEM_QUESTS.filter(
      (t) =>
        t.systemType === "seasonal" && isDateInRange(now, t.generationCriteria.dateRange)
    );
    if (templates.length > 0) {
      return this.generateSystemQuest(templates[0]);
    }
    return null;
  }
}