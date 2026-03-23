import { useUserStore } from "@/store/user";
import { useSkillStore } from "@/store/skill";
import { useSettingsStore } from "@/store/settings";
import { showToast } from "@/utils/toast";
import type { Skill } from "@/types/skills";
import { TUTORIAL } from "@/utils/constants";
import type { TutorialTemplateId } from "./tutorialTypes";
import type { Quest } from "@/types/quest";
import { useTutorialStore } from "./tutorialStore";

function createTutorialSkill(): Skill {
  const now = Date.now();
  return {
    id: TUTORIAL.SKILL_ID,
    key: TUTORIAL.SKILL_KEY,
    name: TUTORIAL.SKILL_NAME,
    verb: TUTORIAL.SKILL_VERB,
    objects: ["app"],
    xp: 0,
    proficiency: 0,
    firstSeenAt: now,
    lastSeenAt: now,
    lastDecayAt: now,
    isDormant: false,
  };
}

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
      const skill = createTutorialSkill();
      useSkillStore.getState().addSkill(skill);
      useTutorialStore.getState().openTutorialSkillNaming(skill.id);
      showToast("success", "new skill unlocked");
      break;
    }
    case "tutorial-05-shop": {
      useTutorialStore.getState().openTutorialCompleteModal();
      break;
    }
    default:
      break;
  }
}
