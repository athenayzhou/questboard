import {
  useState,
  useEffect,
  useMemo,
  useRef,
  useLayoutEffect,
  useCallback,
} from "react";
import { createPortal } from "react-dom";
import { useOverlay } from "../../store/overlay";
import type { Quest } from "../../types/quest";
import { BoardCard } from "../secondary/BoardCard";
import { UI } from "../../utils/constants";
import { FilterQuest } from "../secondary/FilterQuest";
import { useQuestStore } from "../../store/quest";
import { QuestCardSkeleton } from "../ui/SkeletonLoader";
import { IconPlus, IconX, IconChevronRight, IconUserPlus } from "../ui/icons";
import { useTutorialStore } from "@/onboarding/tutorialStore";
import { TUTORIAL_FIRST_LOOP_QUEST_ID } from "@/onboarding/tutorialConstants";
import { templateIdForTutorialSubquestId } from "@/onboarding/tutorialGating";
import { TUTORIAL_QUEST_TEMPLATES } from "@/onboarding/tutorialTemplates";
import { useBoardStore } from "@/store/board";
import { createBoard, fetchBoardQuests, fetchMyBoards, inviteBoardMember } from "@/lib/apiBoards";
import { useIdentityStore } from "@/store/identity";
import { useFriendsStore } from "@/store/friends";

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
  const questTopTab = useOverlay((s) => s.questTopTab);
  const setQuestTopTab = useOverlay((s) => s.setQuestTopTab);
  const tab = useOverlay(s => s.boardTab);
  const setTab = useOverlay(s => s.setBoardTab);
  const openQuestPages = useOverlay(s => s.openQuestPages);
  const boardScope = useOverlay((s) => s.boardScope);
  const setBoardScope = useOverlay((s) => s.setBoardScope);
  const setAddQuestTargetId = useOverlay((s) => s.setAddQuestTargetId);
  const boards = useBoardStore((s) => s.boards);
  const activeBoardId = useBoardStore((s) => s.activeBoardId);
  const setBoards = useBoardStore((s) => s.setBoards);
  const setActiveBoardId = useBoardStore((s) => s.setActiveBoardId);
  const userCode = useIdentityStore((s) => s.userCode);
  const friends = useFriendsStore((s) => s.friends);
  const [boardMenuOpen, setBoardMenuOpen] = useState(false);
  const [inviteMenuOpen, setInviteMenuOpen] = useState(false);
  const boardMenuRef = useRef<HTMLDivElement>(null);
  const boardMenuPortalRef = useRef<HTMLDivElement>(null);
  const boardTriggerRef = useRef<HTMLButtonElement>(null);
  const [boardMenuRect, setBoardMenuRect] = useState<DOMRect | null>(null);
  const inviteMenuRef = useRef<HTMLDivElement>(null);

  const updateBoardMenuPosition = useCallback(() => {
    if (!boardMenuOpen || !boardTriggerRef.current) return;
    setBoardMenuRect(boardTriggerRef.current.getBoundingClientRect());
  }, [boardMenuOpen]);

  useLayoutEffect(() => {
    if (!boardMenuOpen) {
      setBoardMenuRect(null);
      return;
    }
    updateBoardMenuPosition();
    const onReposition = () => updateBoardMenuPosition();
    window.addEventListener("scroll", onReposition, true);
    window.addEventListener("resize", onReposition);
    return () => {
      window.removeEventListener("scroll", onReposition, true);
      window.removeEventListener("resize", onReposition);
    };
  }, [boardMenuOpen, updateBoardMenuPosition]);

  const { questSearch, questFilters } = useOverlay();
  const { isLoading } = useQuestStore();
  const currentSubquest = useTutorialStore((s) => s.currentSubquest);
  const tutorialSpotlight = currentSubquest?.spotlight;
  const firstLoopTemplateId = TUTORIAL_QUEST_TEMPLATES[0]?.templateId;
  const isFirstTutorialChain =
    Boolean(firstLoopTemplateId) &&
    templateIdForTutorialSubquestId(currentSubquest?.id ?? "") ===
      firstLoopTemplateId;

  // Shared boards: hydrate boards list when switching into shared scope.
  useEffect(() => {
    if (activeOverlay !== "quests") return;
    if (boardScope !== "shared") return;
    if (boards.length > 0) return;
    fetchMyBoards()
      .then((b) => setBoards(b))
      .catch((e) => console.error(e));
  }, [activeOverlay, boardScope, boards.length, setBoards]);

  useEffect(() => {
    if (!boardMenuOpen) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (boardMenuRef.current?.contains(t)) return;
      if (boardMenuPortalRef.current?.contains(t)) return;
      setBoardMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [boardMenuOpen]);

  useEffect(() => {
    if (!inviteMenuOpen) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (inviteMenuRef.current?.contains(t)) return;
      setInviteMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [inviteMenuOpen]);

  // Shared boards: load quests for the active board into the quest store.
  useEffect(() => {
    if (activeOverlay !== "quests") return;
    if (boardScope !== "shared") return;
    if (!activeBoardId) return;
    let cancelled = false;
    const load = async () => {
      try {
        const qs = await fetchBoardQuests(activeBoardId);
        if (cancelled) return;
        useQuestStore.getState().setQuest((prev) => {
          const keep = prev.filter((q) => !q.boardId);
          return [...keep, ...qs];
        });
      } catch (e) {
        console.error(e);
      }
    };

    void load();
    const id = window.setInterval(load, 5_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [activeOverlay, boardScope, activeBoardId]);

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
    if (questTopTab === "collab") {
      if (!activeBoardId) return [];
      return quests.filter((q) => q.boardId === activeBoardId && q.status === tab);
    }
    if (questTopTab === "accepted") {
      return quests.filter((q) => {
        if (!q.boardId) return q.status === "accepted";
        return q.status === "accepted" && q.acceptedByUserId === userCode;
      });
    }
    return quests.filter((q) => !q.boardId && q.status === questTopTab);
  }, [quests, tab, questTopTab, activeBoardId, userCode]);
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

  function spotlightForQuest(questId: string): string | undefined {
    if (questId !== TUTORIAL_FIRST_LOOP_QUEST_ID) return undefined;
    if (tab === "available") {
      if (
        tutorialSpotlight === "board-tutorial-card-available" ||
        tutorialSpotlight === "qp-accept"
      ) {
        return "board-tutorial-card-available";
      }
    }
    if (tab === "accepted") {
      if (
        tutorialSpotlight === "board-tutorial-card-accepted" ||
        tutorialSpotlight === "qp-pin"
      ) {
        return "board-tutorial-card-accepted";
      }
    }
    return undefined;
  }

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

  function handleCardClick(e: React.MouseEvent, questId: string) {
    if (didDragRef.current === questId) {
      didDragRef.current = null;
      e.stopPropagation();
      return;
    }
    e.stopPropagation();
    onSelect(questId);
  }

  const lockBoardChrome =
    isFirstTutorialChain &&
    questTopTab !== "collab" &&
    (tutorialSpotlight === "board-tutorial-card-available" ||
      tutorialSpotlight === "board-tutorial-card-accepted" ||
      tutorialSpotlight === "qp-accept" ||
      tutorialSpotlight === "qp-pin");
  const disableAvailableTab =
    lockBoardChrome &&
    (tutorialSpotlight === "board-tutorial-card-accepted" ||
      tutorialSpotlight === "qp-pin");
  const disableAcceptedTab =
    lockBoardChrome &&
    (tutorialSpotlight === "board-tutorial-card-available" ||
      tutorialSpotlight === "qp-accept");

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

  const boardDropdownPortal =
    boardMenuOpen &&
    boardMenuRect &&
    typeof document !== "undefined" &&
    createPortal(
      <div
        ref={boardMenuPortalRef}
        className="quest-board-dropdown__menu quest-board-dropdown__menu--portal"
        role="menu"
        style={{
          top: boardMenuRect.bottom + 8,
          left: boardMenuRect.left,
          minWidth: Math.max(boardMenuRect.width, 220),
        }}
      >
        {boards.map((b) => (
          <button
            key={b.id}
            type="button"
            role="menuitem"
            className={`quest-board-dropdown__item${b.id === activeBoardId ? " is-active" : ""}`}
            onClick={() => {
              setActiveBoardId(b.id);
              setBoardMenuOpen(false);
            }}
          >
            {b.name}
          </button>
        ))}
        <div className="quest-board-dropdown__sep" aria-hidden />
        <button
          type="button"
          role="menuitem"
          className="quest-board-dropdown__item quest-board-dropdown__item--create"
          onClick={() => {
            const name = window.prompt("new board name:");
            if (!name?.trim()) return;
            createBoard(name.trim())
              .then(() => fetchMyBoards().then((b) => setBoards(b)))
              .finally(() => setBoardMenuOpen(false))
              .catch((e) => console.error(e));
          }}
        >
          + add new board
        </button>
      </div>,
      document.body,
    );

  return (
    <div className="overlay quests-overlay">
      <div className="header quests-header">
        <h2>quest board</h2>
        <div className="quest-board-header__tabsWrap">
          <div className="quest-board-tabs" role="tablist" aria-label="Quest board tabs">
            <button
              type="button"
              role="tab"
              aria-selected={questTopTab === "available"}
              className={`quest-board-tab${questTopTab === "available" ? " quest-board-tab--active" : ""}`}
              onClick={() => {
                if (questTopTab === "available") return;
                closeAllQuests();
                setQuestTopTab("available");
                setBoardScope("personal");
                setTab("available");
              }}
            >
              available
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={questTopTab === "accepted"}
              className={`quest-board-tab${questTopTab === "accepted" ? " quest-board-tab--active" : ""}`}
              onClick={() => {
                if (questTopTab === "accepted") return;
                closeAllQuests();
                setQuestTopTab("accepted");
                setBoardScope("personal");
                setTab("accepted");
              }}
            >
              accepted
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={questTopTab === "collab"}
              className={`quest-board-tab${questTopTab === "collab" ? " quest-board-tab--active" : ""}`}
              onClick={() => {
                if (questTopTab === "collab") return;
                closeAllQuests();
                setQuestTopTab("collab");
                setBoardScope("shared");
                setTab("available");
              }}
            >
              collab
            </button>
          </div>
        </div>

        <div className="quest-board-header__actions">
          <FilterQuest />
          <div className="quest-board-trailing">
            <button
              type="button"
              className="add-quest-btn"
              data-spotlight="board-add-quest"
              disabled={lockBoardChrome || (questTopTab === "collab" && !activeBoardId)}
              onClick={() => {
                setAddQuestTargetId(questTopTab === "collab" ? activeBoardId : null);
                openOverlay("addQuest");
              }}
              aria-label="Add quest"
              title={
                lockBoardChrome
                  ? "Finish this tutorial step on the quest board first"
                  : questTopTab === "collab" && !activeBoardId
                    ? "Select a shared board first"
                    : "Add quest"
              }
            >
              <IconPlus size={16} />
            </button>
            <button
              type="button"
              className="close quest-btn"
              onClick={closeOverlay}
              aria-label="Close quest board"
              title="Close"
            >
              <IconX size={18} />
            </button>
          </div>
        </div>

        {questTopTab === "collab" && (
            <div className="quest-board-header__bottom">
              <div className="quest-board-header__bottomLeft" aria-hidden />
              <div className="quest-board-header__subtabs">
                <div
                  className="quest-board-tabs quest-board-tabs--compact"
                  role="tablist"
                  aria-label="Collab quest list"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={tab === "available"}
                    data-spotlight="board-tab-available"
                    disabled={disableAvailableTab}
                    className={`quest-board-tab${tab === "available" ? " quest-board-tab--active" : ""}`}
                    onClick={() => handleTabSwitch("available")}
                  >
                    available
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={tab === "accepted"}
                    data-spotlight="board-tab-accepted"
                    disabled={disableAcceptedTab}
                    className={`quest-board-tab${tab === "accepted" ? " quest-board-tab--active" : ""}`}
                    onClick={() => handleTabSwitch("accepted")}
                  >
                    accepted
                  </button>
                </div>
              </div>

              <div className="quest-board-header__collabRight">
                <div className="quest-board-collab-controls">
                  <div className="quest-board-dropdown" ref={boardMenuRef}>
                    <button
                      ref={boardTriggerRef}
                      type="button"
                      className="quest-board-dropdown__trigger"
                      onClick={() => setBoardMenuOpen((v) => !v)}
                      aria-haspopup="menu"
                      aria-expanded={boardMenuOpen}
                      title="Select a shared board"
                    >
                      <span className="quest-board-dropdown__label">
                        {activeBoardId
                          ? (boards.find((b) => b.id === activeBoardId)?.name ?? "board")
                          : "select board"}
                      </span>
                      <IconChevronRight
                        size={18}
                        className={`quest-board-dropdown__chev${boardMenuOpen ? " is-open" : ""}`}
                        aria-hidden
                      />
                    </button>
                  </div>

                  <div className="quest-board-invite-wrap" ref={inviteMenuRef}>
                    <button
                      type="button"
                      className="add-friend-btn quest-board-invite"
                      disabled={!activeBoardId}
                      onClick={() => setInviteMenuOpen((v) => !v)}
                      title={activeBoardId ? "Invite" : "Select a shared board first"}
                      aria-haspopup="menu"
                      aria-expanded={inviteMenuOpen}
                    >
                      <IconUserPlus size={16} />
                    </button>

                    {inviteMenuOpen && activeBoardId && (
                      <div className="quest-board-invite-menu" role="menu">
                        {friends.length > 0 ? (
                          <>
                            <div className="quest-board-invite-menu__cap">invite a friend</div>
                            {friends.slice(0, 12).map((f) => (
                              <button
                                key={f.id}
                                type="button"
                                role="menuitem"
                                className="quest-board-invite-menu__item"
                                onClick={() => {
                                  inviteBoardMember(activeBoardId, f.id)
                                    .then(() => fetchMyBoards().then((b) => setBoards(b)))
                                    .finally(() => setInviteMenuOpen(false))
                                    .catch((e) => console.error(e));
                                }}
                              >
                                {f.name}
                              </button>
                            ))}
                          </>
                        ) : (
                          <div className="quest-board-invite-menu__empty">no friends yet</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
      </div>
      {boardDropdownPortal}

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
              <BoardCard
                quest={q}
                onSelect={() => {}}
                dataSpotlight={spotlightForQuest(q.id)}
              />
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