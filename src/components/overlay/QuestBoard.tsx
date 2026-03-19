import { useState, useEffect, useMemo, useRef } from "react";
import { useOverlay } from "../../store/overlay";
import type { Quest } from "../../types/quest";
import { BoardCard } from "../secondary/BoardCard";
import { UI } from "../../utils/constants";
import { FilterQuest } from "../secondary/FilterQuest";
import { useQuestStore } from "../../store/quest";
import { QuestCardSkeleton } from "../ui/SkeletonLoader";

type QuestBoardProps = {
  quests: Quest[];
  onSelect: (id: string) => void;
}

export function QuestBoard({
  quests,
  onSelect,
} : QuestBoardProps) {
  const activeOverlay = useOverlay(s => s.activeOverlay);
  const openOverlay = useOverlay(s => s.openOverlay);
  const closeOverlay = useOverlay(s => s.closeOverlay);
  const closeAllQuests = useOverlay(s => s.closeAllQuests);
  const tab = useOverlay(s => s.boardTab);
  const setTab = useOverlay(s => s.setBoardTab);
  const openQuestPages = useOverlay(s => s.openQuestPages);

  const { questSearch, questFilters } = useOverlay();
  const { isLoading } = useQuestStore();

  const dragEnabled = openQuestPages.length === 0;
  const boardRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    startLeft: number;
    startTop: number;
    moved: boolean;
  } | null>(null);
  const didDragRef = useRef<string | null>(null);

  const tabbed = useMemo(() => {
    return quests.filter(q => q.status === tab);
  }, [quests, tab]);
  function handleTabSwitch(newTab: "available" | "accepted") {
    if (newTab === tab) return;
    closeAllQuests();
    setTab(newTab);
  }

  const filtered = useMemo(() => {
    return tabbed.filter(q => {
      if(questSearch){
        const searchLower = questSearch.toLowerCase();
        if(!q.title.toLowerCase().includes(searchLower) &&
           !q.description?.toLowerCase().includes(searchLower) &&
           !q.category?.some(cat => cat.toLowerCase().includes(searchLower))) {
          return false;
        }
      }
      if(questFilters.category && !q.category?.includes(questFilters.category)){
        return false;
      }
      if(questFilters.difficulty && q.difficulty !== questFilters.difficulty){
        return false;
      }
      if(questFilters.status && q.status !== questFilters.status){
        return false;
      }
      return true;
    });
  }, [tabbed, questSearch, questFilters]);

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [questState, setQuestsState] = useState(
    () =>
      tabbed.map(q => ({
        ...q,
        x: Math.random() * UI.SPAWN_X_MAX,
        y: UI.SPAWN_Y_MIN + Math.random() * (UI.SPAWN_Y_MAX - UI.SPAWN_Y_MIN),
        zIndex: 1,
      }))
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQuestsState(prev => {
      const byId = new Map(prev.map(q => [q.id, q]));
      const safeX = (v: number) => Math.max(0, Math.min(v, UI.SPAWN_X_MAX));
      const safeY = (v: number) => Math.max(UI.SPAWN_Y_MIN, Math.min(v, UI.SPAWN_Y_MAX));
      return filtered.map(q => {
        const existing = byId.get(q.id);
        if (existing) {
          return {
            ...q,
            x: safeX(existing.x),
            y: safeY(existing.y),
            zIndex: existing.zIndex ?? 1,
          };
        }
        return {
          ...q,
          x: Math.random() * UI.SPAWN_X_MAX,
          y: UI.SPAWN_Y_MIN + Math.random() * (UI.SPAWN_Y_MAX - UI.SPAWN_Y_MIN),
          zIndex: 1,
        };
      });
    });
  }, [filtered]);

  const bringToFront = (id: string) => {
    setQuestsState(prev => {
      const maxZ = Math.max(...prev.map(q => q.zIndex || 1));
      return prev.map(q =>
        q.id === id ? { ...q, zIndex: maxZ + 1 } : q
      );
    });
  };

  function handleCardMouseDown(e: React.MouseEvent, q: { id: string; x: number; y: number }) {
    if (e.button !== 0 || !dragEnabled) return;
    e.preventDefault();
    bringToFront(q.id);
    dragRef.current = {
      id: q.id,
      startX: e.clientX,
      startY: e.clientY,
      startLeft: q.x,
      startTop: q.y,
      moved: false,
    };
    window.addEventListener("mousemove", handleCardMouseMove);
    window.addEventListener("mouseup", handleCardMouseUp);
  }

  function handleCardMouseMove(e: MouseEvent) {
    const board = boardRef.current;
    const d = dragRef.current;
    if (!board || !d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (!d.moved && (Math.abs(dx) > UI.DRAG_THRESHOLD_PX || Math.abs(dy) > UI.DRAG_THRESHOLD_PX)) {
      d.moved = true;
      setDraggingId(d.id);
    }
    const rect = board.getBoundingClientRect();
    let percentX = (d.startLeft * rect.width / 100 + dx) / rect.width * 100;
    let percentY = (d.startTop * rect.height / 100 + dy) / rect.height * 100;
    const cardEl = board.querySelector(`[data-quest-id="${d.id}"]`);
    if (cardEl) {
      const cardRect = cardEl.getBoundingClientRect();
      const cardW = (cardRect.width / rect.width) * 100;
      const cardH = (cardRect.height / rect.height) * 100;
      percentX = Math.max(0, Math.min(percentX, 100 - cardW));
      percentY = Math.max(0, Math.min(percentY, 100 - cardH));
    } else {
      percentX = Math.max(0, Math.min(percentX, 100));
      percentY = Math.max(0, Math.min(percentY, 100));
    }
    setQuestsState(prev =>
      prev.map(q =>
        q.id === d.id ? { ...q, x: percentX, y: percentY } : q
      )
    );
  }

  function handleCardMouseUp() {
    if (dragRef.current?.moved) {
      didDragRef.current = dragRef.current.id;
    }
    setDraggingId(null);
    window.removeEventListener("mousemove", handleCardMouseMove);
    window.removeEventListener("mouseup", handleCardMouseUp);
    dragRef.current = null;
  }

  function handleCardClick(_e: React.MouseEvent, questId: string) {
    if (didDragRef.current === questId) {
      didDragRef.current = null;
      return;
    }
    onSelect(questId);
  }

  if (isLoading) {
    return (
      <div className="quest-board">
        <div className="quest-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <QuestCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (activeOverlay !== "quests") return null;

  return (
    <div className="overlay quests-overlay">
      <div className="header quests-header">
        <h2>quest board</h2>
        <div className="header-actions quests-header-actions">
          <div className="quest-board-tabs" role="tablist" aria-label="Quest list">
            <button
              type="button"
              role="tab"
              aria-selected={tab === "available"}
              className={`quest-board-tab${tab === "available" ? " quest-board-tab--active" : ""}`}
              onClick={() => handleTabSwitch("available")}
            >
              available
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "accepted"}
              className={`quest-board-tab${tab === "accepted" ? " quest-board-tab--active" : ""}`}
              onClick={() => handleTabSwitch("accepted")}
            >
              accepted
            </button>
          </div>
          <FilterQuest />
          <div className="quest-board-trailing">
            <button
              type="button"
              className="add-quest-btn"
              onClick={() => openOverlay("addQuest")}
            >
              + quest
            </button>
            <button
              type="button"
              className="close quest-btn"
              onClick={closeOverlay}
            >
              close
            </button>
          </div>
        </div>
      </div>

      <div className="quest-board-body">
        <div ref={boardRef} className="quest-board">
          {questState.map(q => (
            <div
              key={q.id}
              data-quest-id={q.id}
              className={`quest-page-card${draggingId === q.id ? " is-dragging" : ""}${!dragEnabled ? " drag-disabled" : ""}`}
              style={{
                position: "absolute",
                left: `${q.x}%`,
                top: `${q.y}%`,
                zIndex: q.zIndex,
              }}
              onMouseDown={(e) => handleCardMouseDown(e, q)}
              onClick={(e) => handleCardClick(e, q.id)}
              onMouseEnter={() => bringToFront(q.id)}
            >
              <BoardCard quest={q} onSelect={() => {}} />
            </div>
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="empty-state">
            {questSearch || Object.keys(questFilters).length > 0
              ? "no quests matching your search"
              : "no quests here"}
            </div>
        )}
      </div>

    </div>
  );
}