import { useState } from "react";
import type { Quest } from "../types/quest";
import type { QuestGroup } from "../utils/grouping";
import { formatDate } from "../utils/date";
import { getGroupSummary, getLatest } from "../utils/grouping";
import { StatusBadge } from "./ui/StatusBadge";

type LogCardProps = {
  group: QuestGroup
}

export function LogCard({
  group,
} : LogCardProps){
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<Quest>(()=>{
    return getLatest(group.quests);
  })
  const summary = getGroupSummary(group);

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

      {open && (
        <div className="log-expanded">
          <div className= "log-details">
              <h5>{active.title}</h5>
              {active.frequency && <p>Frequency: {active.frequency}</p>}
              {active.duration && <p>Duration: {active.duration} min</p>}
              <p>Difficulty: {active.difficulty}</p>
              <button>add as new quest</button>
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