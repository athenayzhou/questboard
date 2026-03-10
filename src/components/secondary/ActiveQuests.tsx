import { useOverlay } from "../../store/overlay";
import { questProgress } from "../../utils/progress";
import { useState, useEffect, useMemo } from "react";
import { useQuestStore } from "../../store/quest";

export function ActiveQuest() {
  const activeOverlay = useOverlay(s => s.activeOverlay);
  const openQuest = useOverlay(s=> s.openQuest);
  const setOverlay = useOverlay((s) => s.openOverlay);
  const setBoardTab = useOverlay((s) => s.setBoardTab);

  const completeQuest = useQuestStore((s) => s.completeQuest);
  const failQuest = useQuestStore((s) => s.failQuest);
  const togglePin = useQuestStore((s) => s.togglePin);
  const reorderPinned = useQuestStore((s) => s.reorderPinned);
  const toggleSubquest = useQuestStore((s) => s.toggleSubquest);

  const quests = useQuestStore(s => s.quests);
  const active = useMemo(
    () => quests.filter(q => q.status === "accepted" && q.pinned)
      .sort((a,b) => (a.order ?? 0) - (b.order ?? 0)),
    [quests]
  );

  const [collapsed, setCollapsed] = useState(true);
  const [expandedQuestId, setExpandedQuestId] = useState<string | null>(null);
  const [draggedQuestId, setDraggedQuestId] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    if(activeOverlay) {
      setCollapsed(true);
    }
  }, [activeOverlay]);

  useEffect(() => {
    if(collapsed){
      setExpandedQuestId(null);
    }
  }, [collapsed]);

  const handleOpenFullQuest = (questId: string) => {
    setOverlay("quests");
    setBoardTab("accepted");
    setCollapsed(true);
    setExpandedQuestId(null);

    setTimeout(() => {
      openQuest(questId);
    }, 50);
  };

  const handleDragStart = (e: React.DragEvent, questId: string) => {
    setDraggedQuestId(questId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', questId);
  };
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverIndex(index);
  }
  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    if(draggedQuestId) {
      reorderPinned(draggedQuestId, dropIndex);
    }
    setDraggedQuestId(null);
    setDragOverIndex(null);
  };
  const handleDragEnd = () => {
    setDraggedQuestId(null);
    setDragOverIndex(null);
  }
  const handleDragLeave = (e: React.DragEvent) => {
    if(!e.currentTarget.contains(e.relatedTarget as Node)){
      setDragOverIndex(null);
    }
  }

  // if(active.length === 0) return null;

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
        {active.length === 0 ? (
          <div className = "no-pinned-quests">
            <small>pin accepted quest pages to see them here</small>
          </div>
        ) : (
          <div className="active-quest-list">
            {active.map((q, index)=> {
            const progress = questProgress(q);
            const isPinned = q.pinned;
            const isExpanded = expandedQuestId === q.id;
            const isDragging = draggedQuestId === q.id;
            const isDragOver = dragOverIndex === index;
            return (
              <div
                key={q.id}
                className={`active-quest-item ${isDragging ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
                draggable={!isExpanded}
                onDragStart={(e) => handleDragStart(e, q.id)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                onDragLeave={handleDragLeave}
                onClick={() =>{
                  if(isDragging) return;
                  setExpandedQuestId(isExpanded ? null : q.id)
                }}
              >
                <div className="quest-header">
                  <span className="title">{q.title}</span>
                  <div 
                    className="drag-handle"
                    onMouseDown={(e) => e.stopPropagation()}
                  >::</div>
                </div>
                <div className="action-buttons">
                  <button 
                    className="pin-btn" 
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePin(q.id);
                    }}>
                      {isPinned ? "📌" : "📍"}
                    </button>
                    <button className="complete-btn" onClick={(e) => {
                      e.stopPropagation();
                      completeQuest(q.id)}
                    }>
                      ✅
                    </button>
                    <button className="fail-btn" onClick={(e) => { 
                      e.stopPropagation();
                      failQuest(q.id)
                    }}>
                      ❌
                    </button>
                  </div>
                {progress && (
                  <div className = "progress-bar">
                    <div className="fill" style={{width : `${progress.ratio *100}%`}} />
                  </div>
                )}

                {isExpanded && (
                  <div className="active-quest-expanded">
                    {q.description && (
                      <div className="quest-description">
                        <p>{q.description}</p>
                      </div> 
                    )}
                    {q.category && q.category.length > 0 && (
                      <div className="quest-categories">
                        {q.category.map(cat => (
                          <span key={cat} className="category-tag">{cat}</span>
                        ))}
                      </div>
                    )}
                  <div className="quest-details">
                    {/* {q.priority && (
                      <div className="detail-row">
                        <span className="label">priority:</span>
                        <span className={`value priority-${q.priority}`}>{q.priority}</span>
                      <d/iv>
                    )} */}
                    {q.duration && (
                      <div className="detail-row">
                        {/* <span className="label">duration:</span> */}
                        <span className={`value duration-${q.duration}`}>{q.duration}</span>
                      </div>
                    )}
                    {q.deadline && (
                      <div className="detail-row">
                        <span className="label">deadline:</span>
                        <span className="value">{new Date(q.deadline).toLocaleDateString()}</span>
                      </div>
                    )}
                    </div>
                    {q.subquests && q.subquests.length > 0 && (
                      <div className="quest-subtasks">
                        <h5>Tasks:</h5>
                        <ul>
                          {q.subquests.map(task => (
                            <li
                              key={task.id}
                              className={task.completed ? "completed" : ""}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input 
                                type="checkbox" 
                                checked={task.completed} 
                                onChange={() => toggleSubquest(q.id, task.id)} 
                                disabled={q.status !== "accepted"}
                              />
                              <span>{task.title}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <button 
                      className="open-full-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenFullQuest(q.id);
                      }}
                      >open full quest page</button>
                  </div>
                )}
              </div>  
            )
          })}
          </div>
        )}
      </div>
    </div>
  );
}