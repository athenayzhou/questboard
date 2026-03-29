import { useQuestStore } from "@/store/quest";
import { useTutorialStore } from "./tutorialStore";
import type { SpotlightTarget } from "./tutorialTypes";
import {
  isFirstChainQuestBoardSpotlightTutorial,
  isTutorialSpotlightAllowed,
} from "./tutorialGating";

export { spotlightIdCompletesStepOnClick } from "./tutorialSpotlightMatching";

export function allowedPointerSpotlightIds(
  step: SpotlightTarget | undefined,
): ReadonlySet<string> {
  if (!step) return new Set();
  const ids = new Set<string>([step]);
  if (step === "pinned-strip") ids.add("pinned-handle");
  if (step === "qp-accept") ids.add("board-tutorial-card-available");
  if (step === "board-tutorial-card-available") ids.add("qp-accept");
  if (step === "qp-pin") ids.add("board-tutorial-card-accepted");
  if (step === "addq-submit") ids.add("addq-form");
  return ids;
}

export function shouldBlockTutorialPointerEvent(target: EventTarget | null): boolean {
  const state = useTutorialStore.getState();
  if (!state.isActive || !state.currentSubquest) return false;
  const sub = state.currentSubquest;
  const quests = useQuestStore.getState().quests;
  if (!isTutorialSpotlightAllowed(sub, quests)) return false;
  if (!sub.spotlight) return false;
  if (!(target instanceof Element)) return false;

  if (target.closest(".tutorial-spotlight-skip")) return false;
  if (target.closest(".pinned-quest-handle")) return false;
  if (
    target.closest(
      '[data-spotlight="board-tab-available"], [data-spotlight="board-tab-accepted"]',
    ) &&
    !isFirstChainQuestBoardSpotlightTutorial(sub)
  ) {
    return false;
  }

  const step = sub.spotlight;
  const allowed = allowedPointerSpotlightIds(step);

  let el: Element | null = target;
  while (el) {
    const ds = el.getAttribute("data-spotlight");
    if (ds) {
      if (step.startsWith("entry-") && ds === "qp-accept") return false;
      if (allowed.has(ds)) return false;
      if (ds === "pinned-strip" && !allowed.has("pinned-strip")) {
        el = el.parentElement;
        continue;
      }
      return true;
    }
    el = el.parentElement;
  }
  if (step.startsWith("entry-")) {
    return false;
  }

  if (target.closest(".quest-page")) return false;
  return true;
}
