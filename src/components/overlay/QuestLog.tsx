import { useOverlay } from "../../types/overlay";
import { quests } from "../../data/quests";
import { LogCard } from "../LogCard";
import type { Quest } from "../../types/quest";

import { group } from "../../utils/grouping";

export function QuestLog(){
  const closeOverlay = useOverlay((s)=> s.closeOverlay);
  const log = quests.filter(
    (q): q is Extract<Quest, {status: "completed" | "failed"}> =>
      q.status === "completed" || q.status === "failed"
  );

  const groups = group(log)

  if(log.length === 0) {
    return <p className="empty-log">no completed tasks yet</p>
  }

  return(
    <div className="overlay log-overlay">
      <div className="header log-header">
        <h2>quest log</h2>
        <div className="header-actions">
          <button className="close log-btn" onClick={closeOverlay}>close</button>
        </div>
      </div>

      {groups.map(group => (
        <LogCard key={group.title} group={group} />
      ))}

    </div>
  )
}