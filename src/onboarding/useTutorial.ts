import { useEffect } from "react";
import { useQuestStore } from "@/store/quest";
import { TUTORIAL_QUEST_TEMPLATES } from "./tutorialTemplates";
import {
  buildTutorialQuest,
  tutorialQuestExists,
  tutorialQuestIdForTemplate,
} from "./tutorialQuest";

type Options = { bootstrapReady: boolean };

export function useTutorialQuestBootstrap(options: Options) {
  const { bootstrapReady } = options;
  const tutorialQuestsKey = useQuestStore((s) =>
    TUTORIAL_QUEST_TEMPLATES.map((t) => {
      const id = tutorialQuestIdForTemplate(t.templateId);
      const q = s.quests.find((x) => x.id === id);
      return q ? `${q.status}:${q.id}` : "missing";
    }).join("|"),
  );
  const setQuest = useQuestStore((s) => s.setQuest);

  useEffect(() => {
    if (!bootstrapReady) return;
    setQuest((prev) => {
      const completedTutorial = (templateId: string) =>
        prev.some(
          (q) =>
            q.isSystemGenerated &&
            q.systemType === "tutorial" &&
            q.generationCriteria?.skillTarget === templateId &&
            q.status === "completed",
        );

      const next = [...prev];

      for (let i = 0; i < TUTORIAL_QUEST_TEMPLATES.length; i++) {
        const tmpl = TUTORIAL_QUEST_TEMPLATES[i];
        if (tutorialQuestExists(next, tmpl.templateId)) continue;

        const prior = TUTORIAL_QUEST_TEMPLATES[i - 1];
        if (prior && !completedTutorial(prior.templateId)) break;

        next.push(buildTutorialQuest(tmpl));
      }

      if (next.length === prev.length) return prev;
      return next;
    });
  }, [bootstrapReady, tutorialQuestsKey, setQuest]);
}

