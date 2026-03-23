import { useTutorialStore } from "./tutorialStore";
import type { SpotlightTarget } from "./tutorialTypes";
import { spotlightIdCompletesStepOnClick } from "./tutorialSpotlightMatching";

export function tryCompleteTutorialSpotlight(spotlight: SpotlightTarget): void {
  const state = useTutorialStore.getState();
  const sub = state.currentSubquest;
  if (sub?.spotlight === spotlight) {
    state.markSubquestComplete(sub.id);
  }
}

export function spotlightIdMatchesCurrentTutorialStep(spotlightId: string): boolean {
  const step = useTutorialStore.getState().currentSubquest?.spotlight;
  return spotlightIdCompletesStepOnClick(spotlightId, step);
}
