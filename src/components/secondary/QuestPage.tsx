import type { Quest } from "../../types/quest";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Detail } from "../ui/Detail";
import { useQuestStore } from "../../store/quest";
import { getRewardCoins, getRewardGems } from "@/lib/questRewards";
import {
  computePlayerQuestReward,
  isSystemGeneratedQuest,
} from "@/lib/computeQuestReward";
import { EditQuest } from "./EditQuest";
import {
  isQuestOverdue,
  getQuestDueBy,
  formatDeadlineForDisplay,
} from "../../utils/recurrence";
import { useConfirm } from "../../store/confirmation";
import {
  IconBookmark,
  IconPencil,
  IconX,
  IconRefreshCw,
  IconClipboard,
  IconSend,
} from "../ui/icons";
import { tryCompleteTutorialSpotlight } from "@/onboarding/tutorialProgress";
import { isTutorial } from "@/onboarding/tutorialTypes";
import { useIdentityStore } from "@/store/identity";
import { isPersonalQuest, userHasPin } from "@/lib/boardScope";
import { useBoardStore } from "@/store/board";
import { useFriendsStore } from "@/store/friends";
import { sendQuestToFriend } from "@/lib/apiQuests";
import { showToast } from "@/utils/toast";

type QuestPageProps = {
  quest: Quest;
  x: number;
  y: number;
  z: number;
  onClose: () => void;
  onFocus: () => void;
  onMove: (x: number, y: number) => void;
};

export function QuestPage({ 
  quest,
  x,
  y,
  z,
  onClose, 
  onFocus,
  onMove,
} : QuestPageProps) {
  const { confirm } = useConfirm();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    // Intentionally sync "now" for overdue display; interval keeps it updated
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);
  const editQuest = useQuestStore((s) => s.editQuest);
  const deleteQuest = useQuestStore((s) => s.deleteQuest);
  const updateRecurrence = useQuestStore((s) => s.updateRecurrence);
  const pauseRecurrence = useQuestStore((s) => s.pauseRecurrence);
  const resumeRecurrence = useQuestStore((s) => s.resumeRecurrence);
  const accept = useQuestStore((s) => s.acceptQuest);
  const complete = useQuestStore((s) => s.completeQuest);
  const fail = useQuestStore((s) => s.failQuest);
  const pin = useQuestStore((s) => s.togglePin);
  const toggleSubquest = useQuestStore((s) => s.toggleSubquest);

  const userCode = useIdentityStore((s) => s.userCode);
  const friends = useFriendsStore((s) => s.friends);
  const isShared = Boolean(quest.boardId);
  const boardName = useBoardStore((s) =>
    quest.boardId ? s.boards.find((b) => b.id === quest.boardId)?.name ?? null : null,
  );
  const acceptedByName = useBoardStore((s) => {
    if (!quest.boardId || !quest.acceptedByUserId) return null;
    const b = s.boards.find((bb) => bb.id === quest.boardId);
    return b?.memberNames?.[quest.acceptedByUserId] ?? null;
  });
  const isAccepter =
    !isShared || !quest.acceptedByUserId || quest.acceptedByUserId === userCode;
  const sharedQuestPinned = Boolean(userCode) && userHasPin(quest, userCode);
  const pinMarked = isPersonalQuest(quest)
    ? Boolean(quest.pinned)
    : sharedQuestPinned;

  const [sendMenuOpen, setSendMenuOpen] = useState(false);
  const sendMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!sendMenuOpen) return;
    function onDocDown(e: MouseEvent) {
      const el = sendMenuRef.current;
      if (!el) return;
      if (e.target instanceof Node && el.contains(e.target)) return;
      setSendMenuOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setSendMenuOpen(false);
    }
    document.addEventListener("mousedown", onDocDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, [sendMenuOpen]);

  const [isEditing, setIsEditing] = useState(false);
  const [animationState, setAnimationState] = useState<"entering" | "entered" | "exiting">("entering");
  const canEdit =
    (quest.status === "available" || quest.isTemplate === true) &&
    !isSystemGeneratedQuest(quest);

  const rewardForDisplay =
    isSystemGeneratedQuest(quest) && quest.reward
      ? quest.reward
      : computePlayerQuestReward(quest);

  useEffect(() => {
    const t = requestAnimationFrame(() => setAnimationState("entered"));
    return () => cancelAnimationFrame(t);
  }, []);

  const handleClose = () => {
    setAnimationState("exiting");
    setTimeout(onClose, 300);
  };

  const handleEditSave = (updates: Partial<Quest>) => {
    const safe = { ...updates };
    delete (safe as { reward?: unknown }).reward;
    if (quest.isTemplate) {
      updateRecurrence(quest.id, safe);
    } else {
      editQuest(
        quest.id,
        safe as Partial<Omit<Quest, "id" | "status" | "createdAt" | "reward">>
      );
    }
    setIsEditing(false);
  };

  const handleEditDelete = () => {
    deleteQuest(quest.id);
    setIsEditing(false);
    handleClose();
  };

  function handleAccept() {
    accept(quest.id);
    tryCompleteTutorialSpotlight("qp-accept");
    handleClose();
  }
  function handleComplete() {
    complete(quest.id);
    handleClose();
  }
  function handleFail() {
    confirm({
      title: "give up quest?",
      message: `give up on "${quest.title}"? this will mark it as failed.`,
      confirmText: "give up",
      cancelText: "keep quest",
      type: "danger",
    }).then((ok) => {
      if (!ok) return;
      fail(quest.id);
      handleClose();
    });
  }

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

  return createPortal(
    <div
      className={`quest-page ${animationState}${isEditing ? " quest-page--editing" : ""}`}
      style={{
        position: "absolute",
        left: x,
        top: y,
        zIndex: z,
      }}
      onMouseDown={onFocus}
    >
      <header className="quest-page-header" onMouseDown={onMouseDown}>
        <div className="quest-page-header-top">
          <h2 className="quest-page-title">{quest.title}</h2>
          <div className="quest-page-header-meta">
            {(quest.sentByUserId || quest.sentByName) && (
              <span
                className="quest-page-pill"
                title={quest.sentByUserId ?? undefined}
              >
                from {quest.sentByName ?? quest.sentByUserId}
              </span>
            )}
            {quest.boardId ? (
              <span className="quest-page-pill quest-page-pill--collab" title={boardName ?? quest.boardId}>
                collab{boardName ? ` · ${boardName}` : ""}
              </span>
            ) : null}
            {isQuestOverdue(quest) && (quest.status === "available" || quest.status === "accepted") && (() => {
              const dueBy = getQuestDueBy(quest);
              const daysAgo = dueBy != null ? Math.floor((now - dueBy) / (1000 * 60 * 60 * 24)) : 0;
              return (
                <span className="quest-page-pill quest-page-pill--overdue" title="Overdue">
                  overdue{dueBy != null && daysAgo > 0 ? ` · ${daysAgo} ${daysAgo === 1 ? "day" : "days"} ago` : ""}
                </span>
              );
            })()}
            {quest.frequency && quest.frequency !== "once" && (() => {
              const templateId = quest.isTemplate ? quest.id : (quest.parentQuestId ?? quest.id);
              return (
                <button
                  type="button"
                  className="quest-page-pill quest-page-pill--recurring quest-page-pill--action"
                  title={quest.paused ? "Click to resume recurrence" : "Click to pause recurrence"}
                  onClick={() => (quest.paused ? resumeRecurrence(templateId) : pauseRecurrence(templateId))}
                >
                  <IconRefreshCw size={14} className="quest-page-pill-icon" />
                  <span>
                    {quest.frequency}
                    {quest.paused ? " (paused)" : ""}
                  </span>
                </button>
              );
            })()}
            {quest.isTemplate && (
              <span className="quest-page-pill quest-page-pill--template" title="Recurring template">
                <IconClipboard size={14} className="quest-page-pill-icon" />
                <span>template</span>
              </span>
            )}
            {quest.parentQuestId && (
              <span className="quest-page-pill quest-page-pill--instance" title="Instance of recurring quest">
                #{quest.recurrenceCount || 1}
              </span>
            )}
          </div>
          <div className="quest-page-actions">
            {!isShared && !isSystemGeneratedQuest(quest) && friends.length > 0 && (
              <div className="quest-board-invite-wrap" ref={sendMenuRef}>
                <button
                  type="button"
                  className="quest-page-tool-btn"
                  onClick={() => setSendMenuOpen((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={sendMenuOpen}
                  aria-label="Send quest to friend"
                  title="Send quest…"
                >
                  <IconSend size={18} />
                </button>
                {sendMenuOpen && (
                  <div className="quest-board-invite-menu" role="menu">
                    <div className="quest-board-invite-menu__cap">send to a friend</div>
                    {friends.slice(0, 12).map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        role="menuitem"
                        className="quest-board-invite-menu__item"
                        onClick={() => {
                          const note = window.prompt("optional note (leave blank for none):") ?? "";
                          sendQuestToFriend({ toUserCode: f.id, quest, note })
                            .then(() => showToast("success", `sent to ${f.name}`))
                            .catch((e) => {
                              console.error(e);
                              showToast("error", "send failed");
                            })
                            .finally(() => setSendMenuOpen(false));
                        }}
                      >
                        {f.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {canEdit && !isEditing && (
              <button
                type="button"
                className="quest-page-tool-btn"
                onClick={() => setIsEditing(true)}
                aria-label="Edit quest"
                title="Edit"
              >
                <IconPencil size={18} />
              </button>
            )}
            {quest.status === "accepted" && isAccepter && (
              <button
                type="button"
                className={`quest-page-tool-btn${pinMarked ? " quest-page-tool-btn--pinned" : ""}`}
                data-spotlight="qp-pin"
                onClick={() => {
                  pin(quest.id);
                  tryCompleteTutorialSpotlight("qp-pin");
                }}
                aria-label={pinMarked ? "Unpin quest" : "Pin quest"}
                title={pinMarked ? "Unpin" : "Pin"}
              >
                <IconBookmark marked={pinMarked} size={18} />
              </button>
            )}
            <button
              type="button"
              className="quest-page-tool-btn"
              onClick={handleClose}
              aria-label="Close"
              title="Close"
            >
              <IconX size={18} />
            </button>
          </div>
        </div>
      </header>

      <div className="quest-page-body">
      {isEditing ? (
        <EditQuest
          quest={quest}
          onSave={handleEditSave}
          onCancel={() => setIsEditing(false)}
          onDelete={handleEditDelete}
        />
      ) : (
      <>
      {quest.description?.trim() && (
        <section className="quest-page-description" aria-label="Description">
          <p>{quest.description.trim()}</p>
        </section>
      )}

      {quest.category && quest.category.length > 0 && (
        <section className="quest-page-block" aria-labelledby="qp-cats">
          <div className="quest-page-tags">
            {quest.category.map((tag) => (
              <span key={tag} className="quest-page-tag">{tag}</span>
            ))}
          </div>
        </section>
      )}

      <section className="quest-details">
        {quest.frequency && quest.frequency !== "once" && quest.paused && (
          <span className="quest-details-paused">recurrence paused</span>
        )}
        <Detail label="difficulty" value={quest.difficulty} />
        {quest.priority && <Detail label="priority" value={quest.priority} />}
        {quest.frequency && <Detail label="frequency" value={quest.frequency} />}
        {quest.duration && <Detail label="duration" value={`${quest.duration} min`} />}
        {quest.deadline && (
          <Detail
            label="deadline"
            value={formatDeadlineForDisplay(quest.deadline)}
          />
        )}
      </section>

      {quest.isTemplate && quest.status === "completed" && !isEditing && (
        <section className="quest-template-actions">
          <button
            type="button"
            className="template-toggle"
            onClick={() => (quest.paused ? resumeRecurrence(quest.id) : pauseRecurrence(quest.id))}
          >
            {quest.paused ? "resume recurrence" : "pause recurrence"}
          </button>
        </section>
      )}

      {quest.subquests && quest.subquests.length > 0 && (
        <section className="quest-page-block quest-subquests">
          <h3 className="quest-page-block-title">subquests</h3>
          <ul>
            {quest.subquests.map((action) => (
              <li key={action.id}>
                <input
                  type="checkbox"
                  checked={action.completed}
                  onChange={() => quest.status === "accepted" && isAccepter && toggleSubquest(quest.id, action.id)}
                  disabled={quest.status !== "accepted" || !isAccepter}
                />
                <span>{action.title}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {rewardForDisplay &&
        (getRewardCoins(rewardForDisplay) > 0 ||
          getRewardGems(rewardForDisplay) > 0 ||
          (rewardForDisplay.xp != null && rewardForDisplay.xp > 0) ||
          (rewardForDisplay.items?.length ?? 0) > 0) && (
        <section className="quest-page-block quest-rewards">
          <h3 className="quest-page-block-title">rewards</h3>
          <ul>
            {getRewardCoins(rewardForDisplay) > 0 && (
              <li>{getRewardCoins(rewardForDisplay)} coins</li>
            )}
            {getRewardGems(rewardForDisplay) > 0 && (
              <li>{getRewardGems(rewardForDisplay)} gems</li>
            )}
            {rewardForDisplay.xp != null && rewardForDisplay.xp > 0 && (
              <li>{rewardForDisplay.xp} xp</li>
            )}
            {rewardForDisplay.items &&
              rewardForDisplay.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
          </ul>
        </section>
      )}

    </>
    )}
      {quest.status === "available" && (
        <footer className="quest-actions">
          <button
            type="button"
            className="accept"
            data-spotlight="qp-accept"
            disabled={
              isEditing ||
              (isShared &&
                !!quest.acceptedByUserId &&
                quest.acceptedByUserId !== userCode)
            }
            title={
              isShared &&
              quest.acceptedByUserId &&
              quest.acceptedByUserId !== userCode
                ? "already accepted by someone else"
                : undefined
            }
            onClick={handleAccept}
          >
            accept quest
          </button>
        </footer>
      )}
      {isShared && quest.status === "accepted" && quest.acceptedByUserId && (
        <span className="quest-page-pill" title="who claimed this">
          accepted by {acceptedByName ?? quest.acceptedByUserId}
        </span>
      )}
      {quest.status === "accepted" && (
        <footer className="quest-actions">
          {!isEditing && isAccepter && (
            <>
              <button
                type="button"
                className="quest-action-complete"
                onClick={handleComplete}
              >
                complete
              </button>
              {!isTutorial(quest) && (
                <button
                  type="button"
                  className="quest-action-fail"
                  onClick={handleFail}
                >
                  give up
                </button>
              )}
            </>
          )}
        </footer>
      )}
      </div>
    </div>,
    document.getElementById("windows")!
  );
}