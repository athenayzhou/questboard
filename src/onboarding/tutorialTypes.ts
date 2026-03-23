import type { Quest } from "@/types/quest";

export type SpotlightTarget =
  | "entry-profile"
  | "entry-quests"
  | "entry-logs"
  | "entry-skills"
  | "entry-settings"
  | "board-tab-available"
  | "board-tab-accepted"
  | "board-add-quest"
  | "board-close"
  | "board-tutorial-card-available"
  | "board-tutorial-card-accepted"
  | "addq-title"
  | "addq-form"
  | "addq-submit"
  | "qp-accept"
  | "qp-pin"
  | "active-strip"
  | "active-handle"
  | "active-complete"
  | "log-overlay"
  | "log-browse-entry"
  | "ledger-skill-row"
  | "close-shop"
  | "inventory"
  | "profile-display-name"
  | "profile-badges"
  | "profile-save"
  | "profile-shop"
  | "ledger-overlay"
  | "shop-overlay"
  | "shop-starter-buy";

export type TutorialTemplateId =
  | "tutorial-01-first-loop"
  | "tutorial-02-quest-log"
  | "tutorial-03-nameplate"
  | "tutorial-04-skill-ledger"
  | "tutorial-05-shop";

export type TutorialSubquest = {
  id: string;
  title: string;
  omitFromQuest?: boolean;
  spotlight?: SpotlightTarget;
};

export type TutorialQuest = {
  templateId: TutorialTemplateId;
  chainIndex: number;
  title: string;
  description: string;
  subquests: TutorialSubquest[];
  reward?: Quest["reward"];
};

export function isTutorial(q: Quest | undefined): boolean {
  return Boolean(q?.isSystemGenerated && q.systemType === "tutorial");
}
