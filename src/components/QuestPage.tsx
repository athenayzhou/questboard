import type { Quest } from "../types/quest";
import { useRef } from "react";
import { createPortal } from "react-dom";
import { Detail } from "./ui/Detail";

type QuestPageProps = {
  quest: Quest;
  x: number;
  y: number;
  z: number;
  onAccept?: () => void;
  onClose: () => void;
  onFocus: () => void;
  onMove: (x: number, y: number) => void;
};

export function QuestPage({ 
  quest,
  x,
  y,
  z,
  onAccept,
  onClose, 
  onFocus,
  onMove,
} : QuestPageProps) {
  const dragOffset = useRef<{ x: number; y: number } | null>(null);

  function onMouseDown(e: React.MouseEvent) {
    onFocus();
    dragOffset.current = {
      x: e.clientX - x,
      y: e.clientY - y,
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }
  function onMouseMove(e: MouseEvent) {
    if(!dragOffset.current) return;
    onMove(
      e.clientX - dragOffset.current.x,
      e.clientY - dragOffset.current.y,
    );
  }
  function onMouseUp(){
    dragOffset.current = null;
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  }

  return createPortal (
    <div 
      className="quest-page"
      style={{
        position: "absolute",
        left: x,
        top: y,
        zIndex: z,
      }}
      onMouseDown={onFocus}
    >
      <header className="quest-page-header" onMouseDown={onMouseDown}>
        <h2>{quest.title}</h2>
        <button onClick={onClose}>x</button>
      </header>

      {quest.category && (
        <div className="quest-tags">
          {quest.category.map((tag) => (
            <span key={tag} className="tag">{tag}</span>
          ))}
        </div>
      )}

      <section className="quest-details">
        <Detail label="difficulty" value={quest.difficulty} />
        {quest.priority && <Detail label="priority" value={quest.priority} />}
        {quest.frequency && <Detail label="frequency" value={quest.frequency} />}
        {quest.duration && <Detail label="duration" value={`${quest.duration} min`} />}
        {quest.deadline && <Detail label="deadline" value={new Date(quest.deadline).toLocaleDateString()} />}
      </section>

      {quest.subquests && quest.subquests.length > 0 && (
        <section className="quest-subquests">
          <h3>subquests</h3>
          <ul>
            {quest.subquests.map((action) => (
              <li key={action.id}>
                <input
                  type="checkbox"
                  checked={action.completed}
                  readOnly
                />
                <span>{action.title}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {quest.reward && (
        <section className="quest-rewards">
          <h3>rewards</h3>
          <ul>
            {quest.reward.xp && <li>xp: {quest.reward.xp}</li>}
            {quest.reward.currency && <li>currency: {quest.reward.currency}</li>}
            {quest.reward.items && quest.reward.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      <footer className="quest-actions">
        {quest.status === "available" && (
          <button className="accept" onClick={onAccept}>
            accept quest
          </button>
        )}
      </footer>

    </div>,
    document.getElementById("windows")!
  )
}