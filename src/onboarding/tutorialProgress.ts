import { useTutorialStore } from "./tutorialStore";
import type { SpotlightTarget } from "./tutorialTypes";
import { spotlightIdCompletesStepOnClick } from "./tutorialSpotlightMatching";

/** Advance the tutorial when the user performs the action for the current spotlight. */
export function tryCompleteTutorialSpotlight(spotlight: SpotlightTarget): void {
  const state = useTutorialStore.getState();
  const sub = state.currentSubquest;
  if (sub?.spotlight === spotlight) {
    state.markSubquestComplete(sub.id);
  }
}

/**
 * Whether a click on `spotlightId` should advance the current step (narrow; see
 * {@link spotlightIdCompletesStepOnClick}).
 */
export function spotlightIdMatchesCurrentTutorialStep(spotlightId: string): boolean {
  const step = useTutorialStore.getState().currentSubquest?.spotlight;
  return spotlightIdCompletesStepOnClick(spotlightId, step);
}
