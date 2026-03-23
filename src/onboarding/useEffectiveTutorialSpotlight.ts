import { useMemo } from "react";
import { useTutorialStore } from "./tutorialStore";
import { useQuestStore } from "@/store/quest";
import { useOverlay } from "@/store/overlay";
import { effectiveTutorialSpotlight } from "./tutorialGating";

export function useEffectiveTutorialSpotlight(): string | undefined {
  const currentSubquest = useTutorialStore((s) => s.currentSubquest);
  const quests = useQuestStore((s) => s.quests);
  const activeOverlay = useOverlay((s) => s.activeOverlay);
  return useMemo(
    () => effectiveTutorialSpotlight(currentSubquest, quests, activeOverlay),
    [currentSubquest, quests, activeOverlay],
  );
}
