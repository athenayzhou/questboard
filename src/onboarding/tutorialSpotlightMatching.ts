import type { SpotlightTarget } from "./tutorialTypes";

export function spotlightIdCompletesStepOnClick(
  clickedId: string,
  step: SpotlightTarget | undefined,
): boolean {
  if (!step) return false;
  if (step === clickedId) return true;
  if (step === "active-strip" && clickedId === "active-handle") return true;
  return false;
}
