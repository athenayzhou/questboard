import type { Quest } from "@/types/quest";
import type { OverlayType } from "@/store/overlay";
import type {
  SpotlightTarget,
  TutorialSubquest,
  TutorialTemplateId,
} from "./tutorialTypes";
import { TUTORIAL_QUEST_TEMPLATES } from "./tutorialTemplates";
import { tutorialQuestIdForTemplate } from "./tutorialQuest";
import { spotlightIdCompletesStepOnClick } from "./tutorialSpotlightMatching";
import { useTutorialStore } from "./tutorialStore";

export function templateIdForTutorialSubquestId(
  subquestId: string,
): TutorialTemplateId | undefined {
  for (const t of TUTORIAL_QUEST_TEMPLATES) {
    if (t.subquests.some((s) => s.id === subquestId)) return t.templateId;
  }
  return undefined;
}

const FIRST_CHAIN_BOARD_LOCK_SPOTLIGHTS = new Set<SpotlightTarget>([
  "board-tutorial-card-available",
  "board-tutorial-card-accepted",
  "qp-accept",
  "qp-pin",
]);

export function isFirstChainQuestBoardSpotlightTutorial(
  subquest: TutorialSubquest | null | undefined,
): boolean {
  if (!subquest?.spotlight) return false;
  if (templateIdForTutorialSubquestId(subquest.id) !== TUTORIAL_QUEST_TEMPLATES[0]?.templateId) {
    return false;
  }
  return FIRST_CHAIN_BOARD_LOCK_SPOTLIGHTS.has(subquest.spotlight);
}


const SPOTLIGHT_WHITELIST_BEFORE_ACCEPT = new Set<SpotlightTarget>([
  "entry-quests",
  "board-tutorial-card-available",
  "board-tab-available",
  "board-tab-accepted",
  "qp-accept",
]);

export function isTutorialSpotlightAllowed(
  subquest: TutorialSubquest | null | undefined,
  quests: Quest[],
): boolean {
  if (!subquest) return false;
  const templateId = templateIdForTutorialSubquestId(subquest.id);
  if (!templateId) return true;
  const qid = tutorialQuestIdForTemplate(templateId);
  const q = quests.find((x) => x.id === qid);
  if (!q) return false;
  if (q.status === "accepted" || q.status === "completed") return true;
  if (q.status === "failed") return false;
  if (q.status === "available") {
    const spot = subquest.spotlight;
    if (!spot) return false;
    return SPOTLIGHT_WHITELIST_BEFORE_ACCEPT.has(spot);
  }
  return false;
}

export function effectiveTutorialSpotlight(
  subquest: TutorialSubquest | null | undefined,
  quests: Quest[],
  activeOverlay: OverlayType,
): string | undefined {
  if (!subquest?.spotlight) return undefined;
  if (!isTutorialSpotlightAllowed(subquest, quests)) return undefined;
  const spot = subquest.spotlight;
  if (spot.startsWith("entry-") && activeOverlay !== null) return undefined;
  return spot;
}

export function shouldAdvanceTutorialOnDataSpotlightClick(
  spotlightId: string,
  quests: Quest[],
  activeOverlay: OverlayType,
): boolean {
  const sub = useTutorialStore.getState().currentSubquest;
  if (!sub) return false;
  if (!spotlightIdCompletesStepOnClick(spotlightId, sub.spotlight)) return false;
  if (!isTutorialSpotlightAllowed(sub, quests)) return false;
  const spot = sub.spotlight;
  if (spot?.startsWith("entry-") && activeOverlay !== null) return false;
  if (spot === "log-browse-entry") return false;
  if (spot === "shop-starter-buy") return false;
  if (spot === "profile-save") return false;
  return true;
}
