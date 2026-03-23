"use client";

import { NameSkill } from "@/components/secondary/NameSkill";
import { useSkillStore } from "@/store/skill";
import { useTutorialStore } from "./tutorialStore";
import { showToast } from "@/utils/toast";

export function TutorialSkillNamePrompt() {
  const skillId = useTutorialStore((s) => s.tutorialSkillNamingSkillId);
  const close = useTutorialStore((s) => s.closeTutorialSkillNaming);
  const skill = useSkillStore((s) =>
    skillId ? s.getById(skillId) : undefined,
  );
  const updateName = useSkillStore((s) => s.updateName);

  const open = Boolean(skillId && skill);

  return (
    <NameSkill
      isOpen={open}
      skill={skill}
      presentationTitle="name your new skill"
      presentationDescription="pick a name you like — you can change it anytime in the skill ledger."
      onNameSelected={(name) => {
        if (skillId) {
          updateName(skillId, name);
          showToast("success", `skill named “${name}”`);
        }
        close();
      }}
      onCancel={close}
    />
  );
}
