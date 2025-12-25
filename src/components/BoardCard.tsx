import type { Quest } from "../types/quest"
import { DifficultyBadge } from "./ui/DifficultyBadge"

type BoardCardProps = {
  quest: Quest,
  onSelect: () => void;
}

export function BoardCard({
  quest,
  onSelect,
}: BoardCardProps) {
  return (
    <div className="quest-card" onClick={onSelect}>
      <div className="quest-card-header">
        <h3 className="quest-title">{quest.title}</h3>
        <DifficultyBadge difficulty={quest.difficulty} />
      </div>

      <div className="quest-card-meta">
        {quest.duration && (
          <span className="quest-duration">⏱ {quest.duration} min</span>
        )}
        {quest.deadline && (
          <span className="quest-deadline">⚠ {quest.deadline} deadline</span>
        )}
      </div>

      {quest.category && (
          <div className="tags quest-tags">
            {quest.category.slice(0,2).map((tag) => (
              <span key={tag} className="tag subtle">{tag}</span>
            ))}
            </div>
        )}
    </div>
  )
}