import { useOverlay } from "../../store/overlay";
import { questProgress } from "../../utils/progress";
import { useState, useEffect, useMemo } from "react";
import { useQuestStore } from "../../store/quest";

export function ActiveQuest() {
  const activeOverlay = useOverlay(s => s.activeOverlay);
  const openQuest = useOverlay(s=> s.openQuest);

  const togglePin = useQuestStore((s) => s.togglePin);
  const completeQuest = useQuestStore((s) => s.completeQuest);
  const failQuest = useQuestStore((s) => s.failQuest)

  const quests = useQuestStore(s => s.quests);
  const active = useMemo(
    () => quests.filter(q => q.status === "accepted" && q.pinned),
    [quests]
  );

  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if(activeOverlay) {
      setCollapsed(true);
    }
  }, [activeOverlay]);

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
          const isPinned = q.pinned;
          return (
            <div
              key={q.id}
              className="active-quest-item"
              onClick={() => openQuest(q.id)}
            >
              <span className="title">{q.title}</span>
              <div className="action-buttons">
                <button 
                  className="pin-btn" 
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePin(q.id);
                  }}>
                    {isPinned ? "📌" : "📍"}
                  </button>
                  <button className="complete-btn" onClick={() => completeQuest(q.id)}>
                    ✅
                  </button>
                  <button className="fail-btn" onClick={() => failQuest(q.id)}>
                    ❌
                  </button>
                </div>
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