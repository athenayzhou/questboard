import type { Quest } from "@/types/quest";
import type { TutorialQuest } from "./tutorialTypes";

export function tutorialQuestIdForTemplate(templateId: string): string {
  return `tutorial-${templateId}`;
}

export function buildTutorialQuest(template: TutorialQuest): Quest {
  const now = Date.now();
  return {
    id: tutorialQuestIdForTemplate(template.templateId),
    title: template.title,
    description: template.description,
    category: ["tutorial"],
    difficulty: "easy",
    status: "available",
    createdAt: now,
    isSystemGenerated: true,
    systemType: "tutorial",
    generationCriteria: {
      skillTarget: template.templateId,
    },
    subquests: template.subquests
      .filter((s) => !s.omitFromQuest)
      .map((s) => ({
        id: s.id,
        title: s.title,
        completed: false,
      })),
    reward: template.reward,
  };
}

export function tutorialQuestExists(
  quests: Quest[],
  templateId: TutorialQuest["templateId"],
): boolean {
  const id = tutorialQuestIdForTemplate(templateId);
  return quests.some((q) => q.id === id);
}