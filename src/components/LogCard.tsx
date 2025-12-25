import { useEffect, useState } from "react";
import type { Quest } from "../types/quest";
import type { QuestGroup } from "../utils/grouping";
import { formatDate } from "../utils/date";

import { getGroupSummary, getLatest } from "../utils/grouping";
// import { Detail } from "./ui/Detail";
import { StatusBadge } from "./ui/StatusBadge";

type LogCardProps = {
  // quest: Quest
  group: QuestGroup
}

export function LogCard({
  // quest,
  group,
} : LogCardProps){
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<Quest>(()=>{
    return getLatest(group.quests);
  })
  const summary = getGroupSummary(group);

  useEffect(()=> {
    console.log(group)
    // console.log(summary)
  },[])

  return(
    <div className={`log-item ${open ? "open" : ""}`}>
      {/* <button className="log-preview" onClick={() => setOpen((v) => !v)}>
        <h4>{quest.title}</h4>
        {quest.category && (
          <div className="tags log-tags">
            {quest.category.map((c)=> (
              <span key={c} className="tag subtle">{c}</span>
            ))}
          </div>
        )}
        <StatusBadge status={quest.status} />
        <span className="date">{formatDate(quest.completedAt)}</span>
      </button> */}

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


        {/* {open && (
          <div className="log-details">
            <Detail label="difficulty" value={quest.difficulty} />
            {quest.frequency && (
              <Detail label="frequency" value={quest.frequency} />
            )}
            {quest.duration && (
              <Detail label="duration" value={`${quest.duration} min`} />
            )}
            {quest.deadline && (
              <Detail label="deadline" value={quest.deadline} />
            )}
          </div>
        )} */}

      {open && (
        <div className="log-expanded">
          <div className= "details">
              <h5>{active.title}</h5>
              {active.frequency && <p>Frequency: {active.frequency}</p>}
              {active.duration && <p>Duration: {active.duration} min</p>}
              <p>Difficulty: {active.difficulty}</p>
              <button>add as new quest</button>
          </div>
          <div className="timeline">
            {group.quests.map(q => (
              <div 
                key={q.id}
                className={`timeline-item ${q.status} ${
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