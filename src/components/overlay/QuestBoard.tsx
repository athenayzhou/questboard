import { useState, useEffect, useMemo } from "react";
import { useOverlay } from "../../store/overlay";
import type { Quest } from "../../types/quest";
import { BoardCard } from "../secondary/BoardCard";

type QuestBoardProps = {
  quests: Quest[];
  onSelect: (id: string) => void;
}

export function QuestBoard({
  quests,
  onSelect,
} : QuestBoardProps) {
  const activeOverlay = useOverlay((s) => s.activeOverlay);
  const openOverlay = useOverlay((s) => s.openOverlay)
  const closeOverlay = useOverlay((s) => s.closeOverlay);
  const closeAllQuests = useOverlay((s) => s.closeAllQuests);

  const [tab, setTab] = useState<"available" | "accepted">("available");
  const filtered = useMemo(() => {
    return quests.filter(q => q.status === tab);
  }, [quests, tab]);
  function handleTabSwitch(newTab: "available" | "accepted"){
    if (newTab === tab) return;
    closeAllQuests();
    setTab(newTab);
  }

  const [questState, setQuestsState] = useState(
    () =>
      filtered.map(q => ({
        ...q,
        x: Math.random() * 80,
        y: Math.random() * 60 + 20,
        zIndex: 1,
      }))
  );

  useEffect(() => {
    setQuestsState(prev => {
      const byId = new Map(prev.map(q => [q.id, q]));
      return filtered.map(q => {
        const existing = byId.get(q.id);
        return (
          existing ?? {
            ...q,
            x: Math.random() * 80,
            y: Math.random() * 60 + 20,
            zIndex: 1,
          }
        );
      });
    });
  }, [filtered]);

  const bringToFront = (id:string) => {
    setQuestsState(prev => {
      const maxZ = Math.max(...prev.map(q => q.zIndex || 1));
      return prev.map(q => 
        q.id === id ? { ...q, zIndex: maxZ + 1 } : q
      );
    });
  };

  if(activeOverlay !== "quests") return null;

  return (
    <div className="overlay quests-overlay">
      <div className="header quests-header">
        <h2>quest board</h2>
        <div className="header-actions">
          <div>
            <button className={tab === "available" ? "active" : ""} onClick={() => handleTabSwitch("available")}>
              available
              </button>
            <button className={tab === "accepted" ? "active" : ""} onClick={() => handleTabSwitch("accepted")}>
              accepted
              </button>
          </div>
          <div>
            <button className="add-quest-btn" onClick={() => openOverlay("addQuest")}>+ quest</button>
            <button className="close quest-btn" onClick={closeOverlay}>close</button>
          </div>
        </div>
      </div>

      <div className="quest-board">
      {questState.map(q => (
        <div
          key={q.id}
          className="quest-page-card"
          style={{
            position: "absolute",
            left: `${q.x}%`,
            top: `${q.y}%`,
            zIndex: q.zIndex,
          }}
          onMouseEnter={() => bringToFront(q.id)}
        >
          <BoardCard
            quest={q}
            onSelect={() => onSelect(q.id)}
          />
        </div>
      ))}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">no quests here</div>
      )}

    </div>
  )
}