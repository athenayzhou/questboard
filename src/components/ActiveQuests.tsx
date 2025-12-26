import { quests } from "../data/quests";
import { useOverlay } from "../types/overlay";
import { questProgress } from "../utils/progress";
import { useState } from "react";

export function ActiveQuest() {
  const openQuest = useOverlay(s=> s.openQuest);
  const togglePin = useOverlay(s=> s.togglePin);
  const pinnedQuestIds = useOverlay(s=> s.pinnedQuestIds);

  const [collapsed, setCollapsed] = useState(false);

  const pinned = quests.filter(q=> pinnedQuestIds.includes(q.id));
  const active = quests.filter(q=> q.status === "accepted");
  if(active.length === 0) return null;

  return (
    <div className={`active-quest-panel ${collapsed ? "collapsed": ""}`}>
      <button 
        className="active-quest-handle" 
        onClick={() => setCollapsed(v=>!v)}
      >
        {collapsed ? "◀" : "▶"}
      </button>

      <div className="active-quest">
        <h4 className="active-quest-title">active quests</h4>
        <div className="active-quest-list">
          {active.map(q=> {
          const progress = questProgress(q);
          const isPinned = pinnedQuestIds.includes(q.id);
          return (
            <div
              key={q.id}
              className="active-quest-item"
              onClick={() => openQuest(q.id)}
            >
              <span className="title">{q.title}</span>
              {/* <span className={`difficulty ${q.difficulty}`}>{q.difficulty}</span> */}
              <button 
                className="pin-btn" 
                onClick={(e) => {
                  e.stopPropagation();
                  togglePin(q.id);
                }}>
                  {isPinned ? "📌" : "📍"}
                </button>
              {progress && (
                <div className = "progress-bar">
                  <div className="fill" style={{width : `${progress.ratio *100}%`}} />
                </div>
              )}
            </div>
          )
        })}
        </div>
      </div>
    </div>
  );
}