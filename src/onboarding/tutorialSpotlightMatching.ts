import type { SpotlightTarget } from "./tutorialTypes";

export function spotlightIdCompletesStepOnClick(
  clickedId: string,
  step: SpotlightTarget | undefined,
): boolean {
  if (!step) return false;
  if (step === clickedId) return true;
  if (step === "pinned-strip" && clickedId === "pinned-handle") return true;
  return false;
}
