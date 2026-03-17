import { useState } from "react";
import type { QuestGroup, CompletedQuest } from "../../utils/format/grouping";
import { formatDate } from "../../utils/format/date";
import { getGroupSummary, getLatest } from "../../utils/format/grouping";
import { StatusBadge } from "../ui/StatusBadge";
import { useQuestStore } from "../../store/quest";
import { useOverlay } from "../../store/overlay";

type LogCardProps = {
  group: QuestGroup
}

export function LogCard({
  group,
} : LogCardProps){
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

  return(
    <div className={`log-item ${open ? "open" : ""}`}>
      <button className="log-preview" onClick={() => setOpen((v) => !v)}>
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
              {active.frequency && <p>Frequency: {active.frequency}</p>}
              {active.duration && <p>Duration: {active.duration} min</p>}
              <p>Difficulty: {active.difficulty}</p>
              <button onClick={handleAddAsNewQuest}>add as new quest</button>
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