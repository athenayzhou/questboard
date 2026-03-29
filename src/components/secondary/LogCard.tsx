import { useState, useEffect } from "react";
import type { QuestGroup, CompletedQuest } from "../../utils/format/grouping";
import { formatDate } from "../../utils/format/date";
import { getGroupSummary, getLatest } from "../../utils/format/grouping";
import { StatusBadge } from "../ui/StatusBadge";
import { useQuestStore } from "../../store/quest";
import { useOverlay } from "../../store/overlay";
import { tryCompleteTutorialSpotlight } from "@/onboarding/tutorialProgress";
import { useBoardStore } from "@/store/board";
import { getRewardCoins, getRewardGems } from "@/lib/questRewards";

type LogCardProps = {
  group: QuestGroup;
  tutorialSpotlightBrowse?: boolean;
};

export function LogCard({
  group,
  tutorialSpotlightBrowse,
}: LogCardProps) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<CompletedQuest | null>(() => {
    return getLatest(group.quests);
  });
  const summary = getGroupSummary(group);
  const boardName = useBoardStore((s) => {
    if (!active?.boardId) return null;
    return s.boards.find((b) => b.id === active.boardId)?.name ?? null;
  });
  const acceptedByName = useBoardStore((s) => {
    if (!active?.boardId || !active.acceptedByUserId) return null;
    const board = s.boards.find((b) => b.id === active.boardId);
    return board?.memberNames?.[active.acceptedByUserId] ?? null;
  });

   const duplicateQuest = useQuestStore((s) => s.duplicateQuest);
   const openOverlay = useOverlay((s) => s.openOverlay);
   const setBoardTab = useOverlay((s) => s.setBoardTab);

  const handleAddAsNewQuest = () => {
    if (!active) return;
    const newQuest = duplicateQuest(active.id);
    if (newQuest) {
      setBoardTab("available");
      openOverlay("quests");
    }
  };

  useEffect(() => {
    if (open && tutorialSpotlightBrowse) {
      tryCompleteTutorialSpotlight("log-browse-entry");
    }
  }, [open, active, tutorialSpotlightBrowse]);

  const rewardSummary = (() => {
    if (!active?.reward) return null;
    const coins = getRewardCoins(active.reward);
    const gems = getRewardGems(active.reward);
    const xp = active.reward.xp ?? 0;
    const parts: string[] = [];
    if (coins > 0) parts.push(`${coins} ${coins === 1 ? "coin" : "coins"}`);
    if (gems > 0) parts.push(`${gems} ${gems === 1 ? "gem" : "gems"}`);
    if (xp > 0) parts.push(`${xp} xp`);
    return parts.length > 0 ? parts.join(", ") : null;
  })();

  return(
    <div className={`log-item ${open ? "open" : ""}`}>
      <button
        type="button"
        className="log-preview"
        data-spotlight={tutorialSpotlightBrowse ? "log-browse-entry" : undefined}
        onClick={() => setOpen((v) => !v)}
      >
        <h4>{summary.title}</h4>
        <div className="tags log-tags">
          {summary.tags.map(tag => (
            <span key={tag} className="tag">{tag}</span>
          ))}
        </div>
        <div className="log-meta">
          <StatusBadge status={summary.latestStatus} />
          <span>{formatDate(summary.latestDate)}</span>
        </div>
      </button>

      {open && active && (
        <div className="log-expanded">
          <div className= "log-details">
              <h5>{active.title}</h5>
              {active.category && active.category.length > 0 && (
                <div className="category-tags">
                  {active.category.map(category => (
                    <span key={category} className="category-tag">
                      {category}
                    </span>
                  ))}
                </div>
              )}
              {active.boardId && (
                <span className="quest-collab-pill" title={boardName ?? active.boardId}>
                  collab{boardName ? ` · ${boardName}` : ""}
                </span>
              )}
              <div className="log-detail">
                <span className="detail-label">status</span>
                <span className="detail-value">{active.status}</span>
              </div>
              <div className="log-detail">
                <span className="detail-label">difficulty</span>
                <span className="detail-value">{active.difficulty}</span>
              </div>
              {active.priority && (
                <div className="log-detail">
                  <span className="detail-label">priority</span>
                  <span className="detail-value">{active.priority}</span>
                </div>
              )}
              {active.frequency && (
                <div className="log-detail">
                  <span className="detail-label">frequency</span>
                  <span className="detail-value">{active.frequency}</span>
                </div>
              )}
              {active.duration && (
                <div className="log-detail">
                  <span className="detail-label">duration</span>
                  <span className="detail-value">{active.duration} min</span>
                </div>
              )}
              {active.acceptedByUserId && (
                <div className="log-detail">
                  <span className="detail-label">accepted by</span>
                  <span className="detail-value">
                    {acceptedByName ?? active.acceptedByUserId}
                  </span>
                </div>
              )}
              {active.sentByUserId && (
                <div className="log-detail">
                  <span className="detail-label">sent by</span>
                  <span className="detail-value">
                    {active.sentByName ?? active.sentByUserId}
                  </span>
                </div>
              )}
              {active.deadline && (
                <div className="log-detail">
                  <span className="detail-label">deadline</span>
                  <span className="detail-value">{active.deadline}</span>
                </div>
              )}
              {active.subquests && active.subquests.length > 0 && (
                <>
                  <div className="log-detail">
                    <span className="detail-label">subquests</span>
                    <span className="detail-value">
                      {active.subquests.filter((s) => s.completed).length}/{active.subquests.length}
                    </span>
                  </div>
                  <div className="log-subquest-list">
                    {active.subquests.map((s) => (
                      <div
                        key={s.id}
                        className={`log-subquest-item${s.completed ? " is-complete" : ""}`}
                      >
                        <span className="log-subquest-check" aria-hidden>
                          {s.completed ? "✓" : "○"}
                        </span>
                        <span className="log-subquest-title">{s.title}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
              {rewardSummary && (
                <div className="log-detail">
                  <span className="detail-label">rewards</span>
                  <span className="detail-value">{rewardSummary}</span>
                </div>
              )}
              {!active.isSystemGenerated &&
                !active.boardId &&
                !active.collabQuest &&
                !active.sentByUserId && (
                <button type="button" onClick={handleAddAsNewQuest}>
                  add as new quest
                </button>
              )}
          </div>
          <div className="log-timeline">
            {group.quests.map(q => (
              <div 
                key={q.id}
                className={`log-timeline-item ${q.status} ${
                  active?.id === q.id ? "active" : ""
                }`}
                onClick={()=> setActive(q)}
              >
                <StatusBadge status={q.status} />
                <span>{formatDate(q.completedAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}