import type { Quest } from "../../types/quest"
import { DifficultyBadge } from "../ui/DifficultyBadge"
import { isQuestOverdue, formatDeadlineMDY } from "../../utils/recurrence"
import { memo } from "react"
import { IconRefreshCw, IconClock, IconAlertTriangle } from "../ui/icons"
import { useBoardStore } from "@/store/board";

type BoardCardProps = {
  quest: Quest;
  onSelect: () => void;
  dataSpotlight?: string;
};

export const BoardCard = memo(function BoardCard({
  quest,
  onSelect,
  dataSpotlight,
}: BoardCardProps) {
  const boardName = useBoardStore((s) =>
    quest.boardId ? s.boards.find((b) => b.id === quest.boardId)?.name ?? null : null,
  );

  return (
    <div
      className="quest-card"
      {...(dataSpotlight ? { "data-spotlight": dataSpotlight } : {})}
      onClick={onSelect}
    >
      <div className="quest-card-header">
        <h3 className="quest-title">{quest.title}</h3>
        <DifficultyBadge difficulty={quest.difficulty} />
      </div>

      <div className="quest-card-meta">
        {quest.sentByUserId || quest.sentByName ? (
          <span
            className="quest-from-pill"
            title={quest.sentByUserId ?? undefined}
          >
            from {quest.sentByName ?? quest.sentByUserId}
          </span>
        ) : null}
        {quest.boardId ? (
          <span className="quest-collab-pill" title={boardName ?? quest.boardId}>
            collab{boardName ? ` · ${boardName}` : ""}
          </span>
        ) : null}
        {quest.collabQuest ? (
          <span
            className="quest-collab-pill"
            title={quest.collabInvitePending ? "Invitation pending" : "Quest collaboration"}
          >
            {quest.collabInvitePending ? "invite pending" : "quest collab"}
          </span>
        ) : null}
        {isQuestOverdue(quest) && (quest.status === "available" || quest.status === "accepted") && (
          <span className="quest-late-badge" title="Past due">late</span>
        )}
        {quest.frequency && quest.frequency !== "once" && (
          <span
            className="quest-recurring-meta quest-meta-item"
            title={quest.paused ? "recurrence paused" : `recurring ${quest.frequency}`}
          >
            <IconRefreshCw size={14} className="quest-card-meta-icon" aria-hidden />
            <span>
              {quest.frequency === "custom" && quest.customFrequency
                ? `${quest.customFrequency}d`
                : quest.frequency}
              {quest.paused && (
                <span className="quest-paused-meta"> paused</span>
              )}
            </span>
          </span>
        )}
        {quest.duration && (
          <span className="quest-duration quest-meta-item">
            <IconClock size={14} className="quest-card-meta-icon" aria-hidden />
            <span>{quest.duration} min</span>
          </span>
        )}
        {quest.deadline && (
          <span
            className={`quest-deadline quest-meta-item${isQuestOverdue(quest) ? " overdue" : ""}`}
          >
            <IconAlertTriangle size={14} className="quest-card-meta-icon" aria-hidden />
            <span>{formatDeadlineMDY(quest.deadline)} deadline</span>
          </span>
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
})