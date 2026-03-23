import { useOverlay } from "../../store/overlay";
import { LogCard } from "../secondary/LogCard";
import type { CompletedQuest } from "../../types/quest";
import { useQuestStore } from "../../store/quest";
import { useTutorialStore } from "@/onboarding/tutorialStore";

import { group } from "../../utils/format/grouping";
import { IconX } from "../ui/icons";

export function QuestLog(){
  const closeOverlay = useOverlay((s)=> s.closeOverlay);
  const quests = useQuestStore((s) => s.quests);
  const logBrowseTutorial =
    useTutorialStore((s) => s.currentSubquest?.spotlight) === "log-browse-entry";
  const log: CompletedQuest[] = quests
    .filter(
      (q): q is CompletedQuest =>
        (q.status === "completed" || q.status === "failed") &&
        typeof q.completedAt === "number"
    )
    .sort((a, b) => b.completedAt - a.completedAt);

  const groups = group(log);

  return(
    <div className="overlay log-overlay">
      <div className="header log-header">
        <h2>quest log</h2>
        <div className="header-actions">
          <button
            type="button"
            className="close log-btn"
            onClick={closeOverlay}
            aria-label="Close quest log"
            title="Close"
          >
            <IconX size={18} />
          </button>
        </div>
      </div>

      <div className="log-content">
        {log.length === 0 ? (
          <p className="empty-log">no completed tasks yet</p>
        ) : (
          groups.map((group) => (
            <LogCard
              key={group.title}
              group={group}
              tutorialSpotlightBrowse={logBrowseTutorial}
            />
          ))
        )}
      </div>

    </div>
  )
}