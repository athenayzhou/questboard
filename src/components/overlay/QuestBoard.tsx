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
import { IconPlus, IconX, IconChevronRight, IconUser, IconClock } from "../ui/icons";
import { useTutorialStore } from "@/onboarding/tutorialStore";
import { TUTORIAL_FIRST_LOOP_QUEST_ID } from "@/onboarding/tutorialConstants";
import { templateIdForTutorialSubquestId } from "@/onboarding/tutorialGating";
import { TUTORIAL_QUEST_TEMPLATES } from "@/onboarding/tutorialTemplates";
import { useBoardStore } from "@/store/board";
import {
  createBoard,
  fetchBoardQuests,
  fetchBoardActivity,
  fetchBoards,
  fetchBoardMembers,
  inviteBoardMember,
  removeBoardMember,
  getBoardInvites,
  acceptBoardInvite,
  declineBoardInvite,
  type BoardMember,
  type BoardActivityEvent,
} from "@/lib/apiBoards";
import { useIdentityStore } from "@/store/identity";
import { useFriendsStore } from "@/store/friends";
import { showToast } from "@/utils/toast";
import { PromptDialog } from "@/components/ui/PromptDialog";
import {
  fetchQuestCollabState,
  invalidateQuestCollabStateInflight,
  mergeCollabQuestSlices,
  mergeQuestStateFromServer,
  subscribeQuestCollabEvents,
} from "@/lib/apiQuestCollab";
import { fetchPersonalQuestsFromServer } from "@/lib/apiQuests";
import { GOLDIE_FRIEND_ID } from "@/data/systemFriends";

type QuestBoardProps = {
  quests: Quest[];
  onSelect: (id: string) => void;
}

type PendingBoardInvite = {
  id: string;
  board_name: string;
  inviter_name: string;
  created_at: string;
};

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
  const [inviteFriendsOpen, setInviteFriendsOpen] = useState(false);
  const boardMenuRef = useRef<HTMLDivElement>(null);
  const boardMenuPortalRef = useRef<HTMLDivElement>(null);
  const boardTriggerRef = useRef<HTMLButtonElement>(null);
  const [boardMenuRect, setBoardMenuRect] = useState<DOMRect | null>(null);
  const inviteMenuRef = useRef<HTMLDivElement>(null);
  const [pendingInvites, setPendingInvites] = useState<PendingBoardInvite[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(false);
  const [boardMembers, setBoardMembers] = useState<BoardMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [createBoardDialogOpen, setCreateBoardDialogOpen] = useState(false);
  const lastSseErrorAtRef = useRef(0);

  const [activityOpen, setActivityOpen] = useState(false);
  const [activityEvents, setActivityEvents] = useState<BoardActivityEvent[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [activityNextBeforeId, setActivityNextBeforeId] = useState<number | null>(null);
  const activityOpenRef = useRef(false);
  const activityNewestIdRef = useRef<number | null>(null);

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

  useEffect(() => {
    if (activeOverlay !== "quests") return;
    if (boardScope !== "shared") return;
    if (boards.length > 0) return;
    fetchBoards()
      .then((b) => setBoards(b))
      .catch((e) => console.error(e));
  }, [activeOverlay, boardScope, boards.length, setBoards]);

  useEffect(() => {
    if(activeOverlay !== "quests" || questTopTab !== "collab"){
      setPendingInvites([]);
      return;
    }

    const loadInvites = async() => {
      setLoadingInvites(true);
      try{
        const invites = await getBoardInvites();
        setPendingInvites(invites);
      } catch (e) {
        console.error("failed to load pending invites", e);
        setPendingInvites([]);
      } finally {
        setLoadingInvites(false);
      }
    };
    loadInvites();
    const interval = setInterval(loadInvites, 10000);
    return () => clearInterval(interval);
  }, [activeOverlay, questTopTab]);

  useEffect(() => {
    if (activeOverlay !== "quests") return;
    let cancelled = false;
    const syncQuests = async () => {
      try {
        const [personal, { invites, collabs }] = await Promise.all([
          fetchPersonalQuestsFromServer(),
          fetchQuestCollabState(),
        ]);
        if (cancelled) return;
        useQuestStore.getState().setQuest((prev) =>
          mergeQuestStateFromServer(prev, personal, invites, collabs),
        );
      } catch (e) {
        console.error("failed to sync quests from server", e);
      }
    };
    void syncQuests();
    const interval = setInterval(() => {
      void syncQuests();
    }, 20000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [activeOverlay]);

  /** Stable string so quests array identity changes don't reconnect every SSE. */
  const collabQuestIdsKey = useMemo(() => {
    return Array.from(
      new Set(
        quests
          .filter((q) => q.collabQuest && !q.collabInvitePending)
          .map((q) => q.id),
      ),
    )
      .sort()
      .slice(0, 8)
      .join("\0");
  }, [quests]);

  const openQuestPageIdsKey = useMemo(
    () =>
      [...openQuestPages]
        .map((p) => p.id)
        .sort()
        .join(","),
    [openQuestPages],
  );

  const openQuestPageIdSet = useMemo(
    () => new Set(openQuestPageIdsKey.split(",").filter(Boolean)),
    [openQuestPageIdsKey],
  );

  const collabSseRefreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  useEffect(() => {
    if (activeOverlay !== "quests") return;
    const allIds = collabQuestIdsKey
      ? collabQuestIdsKey.split("\0").filter(Boolean)
      : [];
    /** QuestPage already subscribes; avoid duplicate EventSources + duplicate fetches. */
    const ids = allIds.filter((id) => !openQuestPageIdSet.has(id));
    if (ids.length === 0) return;

    const scheduleCollabRefresh = () => {
      if (collabSseRefreshTimerRef.current) {
        clearTimeout(collabSseRefreshTimerRef.current);
      }
        collabSseRefreshTimerRef.current = setTimeout(() => {
        collabSseRefreshTimerRef.current = null;
        void (async () => {
          try {
            invalidateQuestCollabStateInflight();
            const { invites, collabs } = await fetchQuestCollabState();
            useQuestStore.getState().setQuest((prev) =>
              mergeCollabQuestSlices(prev, invites, collabs),
            );
          } catch (e) {
            console.error("collab SSE sync failed", e);
          }
        })();
      }, 550);
    };

    const closeFns: Array<() => void> = [];
    for (const qid of ids) {
      closeFns.push(
        subscribeQuestCollabEvents({
          questId: qid,
          cursor: 0,
          onEvent: (ev) => {
            if (ev.type === "collab_invite_accepted") {
              const questIdPayload = ev.payload.questId;
              const accepter = ev.payload.accepterUserCode;
              const name = String(ev.payload.accepterDisplayName ?? "").trim();
              const pageOpenForQuest =
                typeof questIdPayload === "string" &&
                openQuestPageIdSet.has(questIdPayload);
              if (
                !pageOpenForQuest &&
                typeof accepter === "string" &&
                typeof userCode === "string" &&
                accepter !== userCode &&
                name
              ) {
                showToast("success", `${name} accepted collab quest`);
              }
            }
            scheduleCollabRefresh();
          },
        }),
      );
    }
    return () => {
      if (collabSseRefreshTimerRef.current) {
        clearTimeout(collabSseRefreshTimerRef.current);
        collabSseRefreshTimerRef.current = null;
      }
      for (const c of closeFns) c();
    };
  }, [activeOverlay, collabQuestIdsKey, openQuestPageIdSet, userCode]);

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
      setInviteFriendsOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [inviteMenuOpen]);

  useEffect(() => {
    if (!inviteMenuOpen || !activeBoardId) return;
    let cancelled = false;
    const loadMembers = async () => {
      setLoadingMembers(true);
      try {
        const members = await fetchBoardMembers(activeBoardId);
        if (!cancelled) setBoardMembers(members);
      } catch (e) {
        console.error("failed to load board members", e);
        if (!cancelled) setBoardMembers([]);
      } finally {
        if (!cancelled) setLoadingMembers(false);
      }
    };
    void loadMembers();
    return () => {
      cancelled = true;
    };
  }, [inviteMenuOpen, activeBoardId]);

  useEffect(() => {
    if (activeOverlay !== "quests") return;
    if (boardScope !== "shared" || !activeBoardId) return;
    let cancelled = false;
    let eventSource: EventSource | null = null;
    const load = async () => {
      if(cancelled) return;
      try {
        const qs = await fetchBoardQuests(activeBoardId);
        useQuestStore.getState().setQuest((prev) => {
          const keep = prev.filter((q) => !q.boardId);
          return [...keep, ...qs];
        });
      } catch (e) {
        console.error(e);
      }
    };
    const connectSSE = () => {
      if(eventSource) eventSource.close();
      eventSource = new EventSource(
        `/api/boards/${activeBoardId}/events?cursor=0`
      );
      eventSource.addEventListener("board-event", (ev: MessageEvent) => {
        if (cancelled) return;
        void load();

        if (!activityOpenRef.current) return;

        let parsed: unknown;
        try {
          parsed = JSON.parse(String(ev.data ?? ""));
        } catch {
          return;
        }

        const obj = parsed as {
          id?: unknown;
          type?: unknown;
          payload?: unknown;
          ts?: unknown;
        };

        const incomingId =
          typeof obj.id === "number" ? obj.id : Number(obj.id);
        const createdAt =
          typeof obj.ts === "number" ? obj.ts : Number(obj.ts);

        if (!Number.isFinite(incomingId) || !Number.isFinite(createdAt)) return;

        if (
          activityNewestIdRef.current !== null &&
          incomingId <= (activityNewestIdRef.current ?? -Infinity)
        ) {
          return;
        }

        const type = typeof obj.type === "string" ? obj.type : "unknown";
        const payload =
          obj.payload && typeof obj.payload === "object"
            ? (obj.payload as Record<string, unknown>)
            : {};

        setActivityEvents((prev) => {
          if (prev.some((e) => e.id === incomingId)) return prev;
          activityNewestIdRef.current = incomingId;
          return [
            {
              id: incomingId,
              boardId: activeBoardId,
              type,
              payload,
              createdAt,
            },
            ...prev,
          ];
        });
      });
      eventSource.onerror = () => {
        if(cancelled) return;
        const now = Date.now();
        // Browsers auto-reconnect EventSource; keep polling as backup and avoid noisy logs.
        if (now - lastSseErrorAtRef.current > 30000) {
          console.warn("SSE unstable; polling continues as fallback");
          lastSseErrorAtRef.current = now;
        }
      };
    };
    void load();
    connectSSE();
    const pollId = setInterval(() => !cancelled && void load(), 8000);
    return () => {
      cancelled = true;
      eventSource?.close();
      clearInterval(pollId);
    };
  }, [activeOverlay, boardScope, activeBoardId]);

  useEffect(() => {
    activityOpenRef.current = activityOpen;
  }, [activityOpen]);

  useEffect(() => {
    if (activeOverlay !== "quests" || questTopTab !== "collab") {
      setActivityOpen(false);
    }
  }, [activeOverlay, questTopTab]);

  useEffect(() => {
    if (activeOverlay !== "quests") return;
    if (questTopTab !== "collab") return;
    if (!activeBoardId) return;
    if (!activityOpen) return;

    let cancelled = false;
    setLoadingActivity(true);
    setActivityEvents([]);
    setActivityNextBeforeId(null);

    void fetchBoardActivity(activeBoardId, { beforeId: null, limit: 30 })
      .then((res) => {
        if (cancelled) return;
        setActivityEvents(res.events);
        setActivityNextBeforeId(res.nextBeforeId);
        activityNewestIdRef.current = res.events[0]?.id ?? null;
      })
      .catch((e) => {
        if (cancelled) return;
        console.error("failed to load board activity", e);
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingActivity(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeOverlay, questTopTab, activeBoardId, activityOpen]);

  const loadMoreActivity = async () => {
    if (!activeBoardId) return;
    if (!activityNextBeforeId) return;
    setLoadingActivity(true);
    try {
      const res = await fetchBoardActivity(activeBoardId, {
        beforeId: activityNextBeforeId,
        limit: 20,
      });
      setActivityEvents((prev) => {
        if (res.events.length === 0) return prev;
        const existingIds = new Set(prev.map((e) => e.id));
        const merged = [...prev, ...res.events.filter((e) => !existingIds.has(e.id))];
        return merged;
      });
      setActivityNextBeforeId(res.nextBeforeId);
    } catch (e) {
      console.error("failed to load more board activity", e);
    } finally {
      setLoadingActivity(false);
    }
  };

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
        if (q.collabQuest) return q.status === "accepted";
        if (!q.boardId) return q.status === "accepted";
        return q.status === "accepted" && q.acceptedByUserId === userCode;
      });
    }
    return quests.filter((q) => {
      if (q.boardId) return false;
      if (q.collabQuest && q.collabInvitePending) {
        return questTopTab === "available" && q.status === "available";
      }
      if (q.collabQuest) return false;
      return q.status === questTopTab;
    });
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

  const handleAcceptInvite = async(inviteId: string) => {
    try{
      await acceptBoardInvite(inviteId);
      setPendingInvites((prev) => prev.filter((i) => i.id !== inviteId));
      const updatedBoards = await fetchBoards();
      setBoards(updatedBoards);
      showToast("success", "joined board");
    } catch(e) {
      console.error(e);
      showToast("error", "failed to accept invite");
    }
  };
  const handleDeclineInvite = async(inviteId: string) => {
    try{
      await declineBoardInvite(inviteId);
      setPendingInvites((prev) => prev.filter((i) => i.id !== inviteId));
      showToast("info", "invite declined");
    } catch(e) {
      console.error(e);
      showToast("error", "failed to decline invite");
    }
  };

  const myMember = boardMembers.find((m) => m.user_code === userCode);
  const isBoardAdmin = myMember?.role === "admin";
  const activeBoardMemberNames =
    activeBoardId ? boards.find((b) => b.id === activeBoardId)?.memberNames ?? {} : {};

  function formatActivityTime(ts: number) {
    try {
      return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  }

  function activityActorNameFromPayload(payload: Record<string, unknown>) {
    const actorCode =
      (typeof payload.createdBy === "string" && payload.createdBy) ||
      (typeof payload.updatedBy === "string" && payload.updatedBy) ||
      (typeof payload.deletedBy === "string" && payload.deletedBy) ||
      (typeof payload.acceptedByUserId === "string" && payload.acceptedByUserId) ||
      (typeof payload.completedByUserId === "string" && payload.completedByUserId) ||
      (typeof payload.failedByUserId === "string" && payload.failedByUserId) ||
      (typeof payload.pinnedByUserId === "string" && payload.pinnedByUserId);

    if (!actorCode) return "someone";
    return activeBoardMemberNames[actorCode] ?? actorCode;
  }

  function activityQuestTitleFromPayload(payload: Record<string, unknown>) {
    if (typeof payload.questTitle === "string" && payload.questTitle.trim()) {
      return payload.questTitle.trim();
    }
    if (typeof payload.questId === "string" && payload.questId.trim()) {
      return `quest ${payload.questId}`;
    }
    return "quest";
  }

  function activitySummary(ev: BoardActivityEvent): string {
    const payload = ev.payload ?? {};
    const actor = activityActorNameFromPayload(payload);
    const questTitle = activityQuestTitleFromPayload(payload);

    switch (ev.type) {
      case "quest_created":
        return `${actor} created quest: "${questTitle}"`;
      case "quest_updated":
        return `${actor} updated quest: "${questTitle}"`;
      case "quest_deleted":
        return `${actor} deleted quest: "${questTitle}"`;
      case "quest_accepted":
        return `${actor} accepted quest: "${questTitle}"`;
      case "quest_completed":
        return `${actor} completed quest: "${questTitle}"`;
      case "quest_failed":
        return `${actor} failed quest: "${questTitle}"`;
      default: {
        const t = String(ev.type ?? "event").replaceAll("_", " ");
        return `${actor} ${t}`;
      }
    }
  }
  

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
            setCreateBoardDialogOpen(true);
          }}
        >
          + add new board
        </button>

        {pendingInvites.length > 0 && (
          <>
            <div className="quest-board-dropdown__sep" aria-hidden />
              <div className="quest-board-invite-menu__cap">pending invites</div>
              {pendingInvites.map((inv) => (
                <div key={inv.id} className="quest-board-dropdown__item" style={{ display: "flex", justifyContent: "space-between" }}>
                  <div className="quest-board-member-label">
                    {inv.board_name}
                    <span className="quest-board-invite-menu__meta">from {inv.inviter_name}</span>
                  </div>
                  <div className="quest-board-invite-actions">
                    <button
                      type="button"
                      className="quest-board-invite-action-btn"
                      onClick={() => handleAcceptInvite(inv.id)}
                    >
                      accept
                    </button>
                    <button
                      type="button"
                      className="quest-board-invite-action-btn quest-board-invite-action-btn--ghost"
                      onClick={() => handleDeclineInvite(inv.id)}
                    >
                      decline
                    </button>
                  </div>
                </div>
              ))}
          </>
        )}
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
                      <IconUser size={16} />
                    </button>

                    {inviteMenuOpen && activeBoardId && (
                      <div className="quest-board-invite-menu" role="menu">
                        <div className="quest-board-invite-menu__cap">board members</div>
                        {loadingMembers ? (
                          <div className="quest-board-invite-menu__empty">loading members…</div>
                        ) : boardMembers.length > 0 ? (
                          boardMembers.map((m) => (
                            <div key={m.user_code} className="quest-board-invite-menu__item">
                              <span className="quest-board-member-label">
                                {m.display_name || m.user_code}
                                <span className="quest-board-invite-menu__meta">
                                  {m.role}
                                </span>
                              </span>
                              {isBoardAdmin && m.user_code !== userCode ? (
                                <button
                                  type="button"
                                  className="quest-board-member-remove"
                                  onClick={() => {
                                    void removeBoardMember(activeBoardId, m.user_code)
                                      .then(() => fetchBoardMembers(activeBoardId).then(setBoardMembers))
                                      .then(() => fetchBoards().then((b) => setBoards(b)))
                                      .catch((e) => {
                                        console.error(e);
                                        showToast("error", "failed to remove member");
                                      });
                                  }}
                                >
                                  remove
                                </button>
                              ) : null}
                            </div>
                          ))
                        ) : (
                          <div className="quest-board-invite-menu__empty">no members found</div>
                        )}
                        <div className="quest-board-invite-menu__sep" />
                        <button
                          type="button"
                          className="quest-board-invite-menu__item quest-board-invite-menu__invite-btn"
                          onClick={() => setInviteFriendsOpen((v) => !v)}
                        >
                          invite friends
                        </button>
                        {inviteFriendsOpen ? (
                          friends.some((f) => f.id !== GOLDIE_FRIEND_ID) ? (
                            <>
                              <div className="quest-board-invite-menu__cap">friends</div>
                              {friends
                                .filter((f) => f.id !== GOLDIE_FRIEND_ID)
                                .slice(0, 12)
                                .map((f) => (
                                <button
                                  key={f.id}
                                  type="button"
                                  role="menuitem"
                                  className="quest-board-invite-menu__item"
                                  onClick={() => {
                                    inviteBoardMember(activeBoardId, f.id)
                                      .then(() => fetchBoards().then((b) => setBoards(b)))
                                      .then(() => fetchBoardMembers(activeBoardId).then(setBoardMembers))
                                      .finally(() => setInviteFriendsOpen(false))
                                      .catch((e) => {
                                        console.error(e);
                                        const msg =
                                          e instanceof Error && e.message.trim()
                                            ? e.message
                                            : "invite failed";
                                        showToast("error", msg);
                                      });
                                  }}
                                >
                                  {f.name}
                                </button>
                              ))}
                            </>
                          ) : (
                            <div className="quest-board-invite-menu__empty">no friends yet</div>
                          )
                        ) : null}
                        {loadingInvites && pendingInvites.length === 0 ? (
                          <div className="quest-board-invite-menu__empty">loading invites…</div>
                        ) : null}
                        {pendingInvites.length > 0 ? (
                          <>
                            <div className="quest-board-invite-menu__sep" />
                            <div className="quest-board-invite-menu__cap">pending invites</div>
                            {pendingInvites.map((inv) => (
                              <div key={inv.id} className="quest-board-invite-menu__item">
                                <span className="quest-board-member-label">
                                  {inv.board_name}
                                  <span className="quest-board-invite-menu__meta">
                                    from {inv.inviter_name}
                                  </span>
                                </span>
                                <div className="quest-board-invite-actions">
                                  <button
                                    type="button"
                                    className="quest-board-invite-action-btn"
                                    onClick={() => handleAcceptInvite(inv.id)}
                                  >
                                    accept
                                  </button>
                                  <button
                                    type="button"
                                    className="quest-board-invite-action-btn quest-board-invite-action-btn--ghost"
                                    onClick={() => handleDeclineInvite(inv.id)}
                                  >
                                    decline
                                  </button>
                                </div>
                              </div>
                            ))}
                          </>
                        ) : null}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    className={`add-friend-btn quest-board-activity-toggle${
                      activityOpen ? " is-open" : ""
                    }`}
                    disabled={!activeBoardId}
                    aria-pressed={activityOpen}
                    title="Board activity"
                    aria-label="Board activity"
                    onClick={() => {
                      setActivityOpen((v) => !v);
                    }}
                  >
                    <IconClock size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}
      </div>
      {boardDropdownPortal}

      <div className="quest-board-body">
        {questTopTab === "collab" && activityOpen ? (
          <div className="quest-board-activity-panel">
            <div className="quest-board-activity-panel__head">
              <div className="quest-board-activity-panel__title">activity</div>
              <button
                type="button"
                className="close quest-btn"
                onClick={() => {
                  setActivityOpen(false);
                  setActivityEvents([]);
                  setActivityNextBeforeId(null);
                  activityNewestIdRef.current = null;
                }}
                aria-label="Close activity"
                title="Close"
              >
                <IconX size={18} />
              </button>
            </div>

            <div
              className="quest-board-activity-panel__list"
              role="list"
            >
              {loadingActivity ? (
                <div className="quest-board-activity-panel__empty">
                  loading…
                </div>
              ) : activityEvents.length === 0 ? (
                <div className="quest-board-activity-panel__empty">
                  no activity yet
                </div>
              ) : (
                activityEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="quest-board-activity-item"
                    role="listitem"
                  >
                    <div className="quest-board-activity-item__time">
                      {formatActivityTime(ev.createdAt)}
                    </div>
                    <div className="quest-board-activity-item__text">
                      {activitySummary(ev)}
                    </div>
                  </div>
                ))
              )}
            </div>

            {activityNextBeforeId !== null && !loadingActivity ? (
              <button
                type="button"
                className="quest-board-activity-panel__loadMore"
                onClick={() => {
                  void loadMoreActivity();
                }}
              >
                load earlier
              </button>
            ) : null}
          </div>
        ) : (
          <>
            <div ref={boardRef} className="quest-board">
              {questState.map((q) => (
                <div
                  key={q.id}
                  data-quest-id={q.id}
                  className={`quest-page-card${
                    draggingId === q.id ? " is-dragging" : ""
                  }${!dragEnabled ? " drag-disabled" : ""}`}
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
          </>
        )}
      </div>
      <PromptDialog
        isOpen={createBoardDialogOpen}
        title="create board"
        message="name your new shared board."
        placeholder="e.g. weekend crew"
        maxLength={64}
        confirmText="create"
        cancelText="cancel"
        onCancel={() => setCreateBoardDialogOpen(false)}
        onConfirm={(value) => {
          const name = value.trim();
          setCreateBoardDialogOpen(false);
          if (!name) return;
          createBoard(name)
            .then(() => fetchBoards().then((b) => setBoards(b)))
            .catch((e) => {
              console.error(e);
              showToast("error", "failed to create board");
            })
            .finally(() => setBoardMenuOpen(false));
        }}
      />

    </div>
  );
}