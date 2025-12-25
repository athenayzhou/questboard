import { useState } from "react";
import { useOverlay } from "../../types/overlay";
import type { Quest } from "../../types/quest";
import { BoardCard } from "../BoardCard";

type QuestBoardProps = {
  quests: Quest[];
  onSelect: (id: string) => void;
}

export function QuestBoard({
  quests = [], 
  onSelect,
} : QuestBoardProps) {
  const closeOverlay = useOverlay((s) => s.closeOverlay);
  const board = quests.filter(q => q.status === "available");

  const [questState, setQuestsState] = useState(
    board.map(q => ({
      ...q,
      x: Math.random() * 80,
      y: Math.random() * 60 +20,
      zIndex: 1,
    }))
  );

  const bringToFront = (id:string) => {
    setQuestsState(prev => {
      const maxZ = Math.max(...prev.map(q => q.zIndex || 1));
      return prev.map(q => 
        q.id === id ? { ...q, zIndex: maxZ + 1 } : q
      );
    });
  };


  return (
    <div className="overlay quests-overlay">
      <div className="header quests-header">
        <h2>quest board</h2>
        <div className="header-actions">
          <button className="add-quest-btn">+ quest</button>
          <button className="close quest-btn" onClick={closeOverlay}>close</button>
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

    </div>
  )
}