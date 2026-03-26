import { useOverlay } from "../../store/overlay";
import { questProgress } from "../../utils/skill/analysis/experience";
import { useState, useEffect, useMemo, useRef } from "react";
import { useQuestStore } from "../../store/quest";
import { formatDeadlineMDY } from "../../utils/recurrence";
import {
  IconBookmark,
  IconCheck,
  IconBan,
  IconChevronLeft,
  IconChevronRight,
  IconGripVertical,
} from "../ui/icons";
import { tryCompleteTutorialSpotlight } from "@/onboarding/tutorialProgress";
import { isPersonalQuest, userHasPin } from "@/lib/boardScope";
import { useIdentityStore } from "@/store/identity";

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
  // const active = useMemo(
  //   () => quests.filter(q => q.status === "accepted" && q.pinned)
  //     .sort((a,b) => (a.order ?? 0) - (b.order ?? 0)),
  //   [quests]
  // );

  const [collapsed, setCollapsed] = useState(true);
  const [expandedQuestId, setExpandedQuestId] = useState<string | null>(null);
  const [draggedQuestId, setDraggedQuestId] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const isDraggingRef = useRef(false);

  const userCode = useIdentityStore((s) => s.userCode);
  const active = useMemo(() => {
    return quests
      .filter((q) => {
        if(q.status !== "accepted") return false;
        if(isPersonalQuest(q)) return q.pinned === true;
        if(!userCode || q.acceptedByUserId !== userCode) return false;
        return userHasPin(q, userCode);
      })
      .sort((a, b) => {
        const oa = isPersonalQuest(a)
          ? (a.order ?? 0)
          : (a.sharedQuestPins?.[userCode!]?.order ?? 0);
        const ob = isPersonalQuest(b)
          ? (b.order ?? 0)
          : (b.sharedQuestPins?.[userCode!]?.order ?? 0);
        return oa-ob;
      });
  }, [quests, userCode]);

  useEffect(() => {
    if (activeOverlay) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCollapsed(true);
    }
  }, [activeOverlay]);

  useEffect(() => {
    if (collapsed) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
    isDraggingRef.current = true;
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
    isDraggingRef.current = false;
    setDraggedQuestId(null);
    setDragOverIndex(null);
  };
  const handleDragEnd = () => {
    isDraggingRef.current = false;
    setDraggedQuestId(null);
    setDragOverIndex(null);
  }

  return (
    <div
      className={`active-quest-panel ${collapsed ? "collapsed" : ""}`}
      data-spotlight="active-strip"
    >
      <button
        type="button"
        className="active-quest-handle"
        data-spotlight="active-handle"
        onClick={() => setCollapsed((v) => !v)}
        aria-label={collapsed ? "Expand active quests" : "Collapse active quests"}
      >
        {collapsed ? <IconChevronRight size={20} /> : <IconChevronLeft size={20} />}
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
            const isPinned = isPersonalQuest(q)
              ? q.pinned
              : Boolean(userCode && userHasPin(q, userCode));
            const canAct = !q.boardId || q.acceptedByUserId === userCode;
            const isExpanded = expandedQuestId === q.id;
            const isDragging = draggedQuestId === q.id;
            const isDragOver = dragOverIndex === index;
            return (
              <div
                key={q.id}
                className={`active-quest-item ${isDragging ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                onClick={() =>{
                  if (isDraggingRef.current || draggedQuestId) return;
                  setExpandedQuestId(isExpanded ? null : q.id)
                }}
              >
                <div className="quest-header">
                  <span className="title">{q.title}</span>
                  <div
                    className="drag-handle"
                    onMouseDown={(e) => e.stopPropagation()}
                    draggable
                    onDragStart={(e) => {
                      e.stopPropagation();
                      handleDragStart(e, q.id);
                    }}
                    onDragEnd={handleDragEnd}
                    title="Drag to reorder"
                    aria-hidden
                  >
                    <IconGripVertical size={16} />
                  </div>
                </div>
                <div className="action-buttons">
                  <button
                    type="button"
                    className="pin-btn"
                    title={isPinned ? "Unpin" : "Pin"}
                    aria-label={isPinned ? "Unpin quest" : "Pin quest"}
                    onClick={(e) => {
                      e.stopPropagation();
                      if(!canAct) return;
                      togglePin(q.id);
                    }}
                  >
                    <IconBookmark marked={isPinned} size={18} />
                  </button>
                  <button
                    type="button"
                    className="complete-btn"
                    data-spotlight="active-complete"
                    title="Complete"
                    aria-label="Complete quest"
                    onClick={(e) => {
                      e.stopPropagation();
                      if(!canAct) return;
                      tryCompleteTutorialSpotlight("active-complete");
                      completeQuest(q.id);
                    }}
                  >
                    <IconCheck size={18} />
                  </button>
                  <button
                    type="button"
                    className="fail-btn"
                    title="Fail"
                    aria-label="Fail quest"
                    onClick={(e) => {
                      e.stopPropagation();
                      if(!canAct) return;
                      failQuest(q.id);
                    }}
                  >
                    <IconBan size={18} />
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
                    {q.duration && (
                      <div className="detail-row">
                        <span className={`value duration-${q.duration}`}>{q.duration}</span>
                      </div>
                    )}
                    {q.deadline && (
                      <div className="detail-row">
                        <span className="label">deadline:</span>
                        <span className="value">
                          {formatDeadlineMDY(q.deadline)}
                        </span>
                      </div>
                    )}
                    </div>
                    {q.subquests && q.subquests.length > 0 && (
                      <div className="quest-subtasks">
                        <h5>subquests:</h5>
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
                                onChange={() => {
                                  if(!canAct) return;
                                  toggleSubquest(q.id, task.id);
                                }} 
                                disabled={q.status !== "accepted" || !canAct}
                              />
                              <span>{task.title}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <button
                      type="button"
                      className="open-full-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenFullQuest(q.id);
                      }}
                      aria-label="Open full quest page"
                    >
                      open full details
                    </button>
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