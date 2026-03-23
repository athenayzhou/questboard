import { useState, useEffect } from "react";
import type { QuestGroup, CompletedQuest } from "../../utils/format/grouping";
import { formatDate } from "../../utils/format/date";
import { getGroupSummary, getLatest } from "../../utils/format/grouping";
import { StatusBadge } from "../ui/StatusBadge";
import { useQuestStore } from "../../store/quest";
import { useOverlay } from "../../store/overlay";
import { tryCompleteTutorialSpotlight } from "@/onboarding/tutorialProgress";

type LogCardProps = {
  group: QuestGroup;
  tutorialSpotlightBrowse?: boolean;
};

export function LogCard({
  group,
  tutorialSpotlightBrowse,
}: LogCardProps) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<CompletedQuest | null>(() => {
    return getLatest(group.quests);
  });
  const summary = getGroupSummary(group);

   const duplicateQuest = useQuestStore((s) => s.duplicateQuest);
   const openOverlay = useOverlay((s) => s.openOverlay);
   const setBoardTab = useOverlay((s) => s.setBoardTab);

  const handleAddAsNewQuest = () => {
    if (!active) return;
    const newQuest = duplicateQuest(active.id);
    if (newQuest) {
      setBoardTab("available");
      openOverlay("quests");
    }
  };

  useEffect(() => {
    if (open && tutorialSpotlightBrowse) {
      tryCompleteTutorialSpotlight("log-browse-entry");
    }
  }, [open, active, tutorialSpotlightBrowse]);

  return(
    <div className={`log-item ${open ? "open" : ""}`}>
      <button
        type="button"
        className="log-preview"
        data-spotlight={tutorialSpotlightBrowse ? "log-browse-entry" : undefined}
        onClick={() => setOpen((v) => !v)}
      >
        <h4>{summary.title}</h4>
        <div className="tags log-tags">
          {summary.tags.map(tag => (
            <span key={tag} className="tag">{tag}</span>
          ))}
        </div>
        <div className="log-meta">
          <StatusBadge status={summary.latestStatus} />
          <span>{formatDate(summary.latestDate)}</span>
        </div>
      </button>

      {open && active && (
        <div className="log-expanded">
          <div className= "log-details">
              <h5>{active.title}</h5>
              {active.category && active.category.length > 0 && (
                <div className="category-tags">
                  {active.category.map(category => (
                    <span key={category} className="category-tag">
                      {category}
                    </span>
                  ))}
                </div>
              )}
              {active.frequency && <p>frequency: {active.frequency}</p>}
              {active.duration && <p>duration: {active.duration} min</p>}
              <p>difficulty: {active.difficulty}</p>
              {!active.isSystemGenerated && (
                <button type="button" onClick={handleAddAsNewQuest}>
                  add as new quest
                </button>
              )}
          </div>
          <div className="log-timeline">
            {group.quests.map(q => (
              <div 
                key={q.id}
                className={`log-timeline-item ${q.status} ${
                  active?.id === q.id ? "active" : ""
                }`}
                onClick={()=> setActive(q)}
              >
                <StatusBadge status={q.status} />
                <span>{formatDate(q.completedAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}