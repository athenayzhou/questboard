import { useUserStore } from "@/store/user";
import { useSettingsStore } from "@/store/settings";
import { showToast } from "@/utils/toast";
import { TUTORIAL } from "@/utils/constants";
import type { TutorialTemplateId } from "./tutorialTypes";
import type { Quest } from "@/types/quest";
import { useTutorialStore } from "./tutorialStore";
import { ensureTutorialSkill, awardTutorialQuestSkillXP } from "./tutorialSkill";

export function applyTutorialRewards(quest: Quest): void {
  const templateId = quest.generationCriteria?.skillTarget as
    | TutorialTemplateId
    | undefined;
  if (!templateId) return;

  switch (templateId) {
    case "tutorial-02-quest-log": {
      useUserStore.getState().unlockBadge(TUTORIAL.BADGE_ID);
      showToast("success", "badge unlocked: newbie");
      break;
    }
    case "tutorial-03-nameplate": {
      useSettingsStore.getState().setAutoNameSkills(false);
      const skill = ensureTutorialSkill();
      useTutorialStore.getState().openTutorialSkillNaming(skill.id);
      awardTutorialQuestSkillXP(quest);
      showToast("success", "new skill unlocked");
      break;
    }
    case "tutorial-04-skill-ledger": {
      awardTutorialQuestSkillXP(quest);
      break;
    }
    case "tutorial-05-shop": {
      useTutorialStore.getState().openTutorialCompleteModal();
      awardTutorialQuestSkillXP(quest);
      break;
    }
    default:
      break;
  }
}
