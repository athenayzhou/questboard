import type { Quest } from "@/types/quest";
import type { SharedBoard } from "@/types/board";
import { coerceQuestCategoryAndSubquests } from "@/lib/coerceQuestFromServer";
import {
  isSessionExpiredError,
  throwIfUnauthorized,
} from "@/lib/sessionRecovery";

export type BoardMember = {
  user_code: string;
  display_name: string;
  role: string;
};

export type BoardActivityEvent = {
  id: number;
  boardId: string;
  type: string;
  payload: Record<string, unknown>;
  createdAt: number;
}

export async function fetchBoards(): Promise<SharedBoard[]> {
  const res = await fetch("/api/me/boards", { credentials: "include" });
  await throwIfUnauthorized(res);
  if (!res.ok) throw new Error(`boards fetch failed: ${res.status}`);
  const json = (await res.json().catch(() => null)) as unknown;
  if (!json || typeof json !== "object") return [];
  const boards = (json as { boards?: unknown }).boards;
  return Array.isArray(boards) ? (boards as SharedBoard[]) : [];
}

/** Merges refetched board rows with prior store copies so partial JSON never drops tags/subquests. */
export function mergeBoardQuestFetchWithPrev(
  prev: Quest[],
  boardId: string,
  serverQs: Quest[],
): Quest[] {
  const keep = prev.filter((q) => !q.boardId);
  const prevBoard = new Map(
    prev.filter((q) => q.boardId === boardId).map((q) => [q.id, q]),
  );
  const merged = serverQs.map((sq) => {
    const old = prevBoard.get(sq.id);
    if (!old) return coerceQuestCategoryAndSubquests(sq);
    const next = {
      ...old,
      ...sq,
      category:
        sq.category && sq.category.length > 0 ? sq.category : old.category,
      subquests:
        sq.subquests && sq.subquests.length > 0 ? sq.subquests : old.subquests,
    } as Quest;
    return coerceQuestCategoryAndSubquests(next);
  });
  return [...keep, ...merged];
}

export async function fetchBoardQuests(boardId: string): Promise<Quest[]> {
  const res = await fetch(`/api/boards/${boardId}/quests`, {
    credentials: "include",
  });
  await throwIfUnauthorized(res);
  if (!res.ok) throw new Error(`board quests fetch failed: ${res.status}`);
  const json = (await res.json().catch(() => null)) as unknown;
  if (!json || typeof json !== "object") return [];
  const quests = (json as { quests?: unknown }).quests;
  if (!Array.isArray(quests)) return [];
  return (quests as Quest[]).map((q) => coerceQuestCategoryAndSubquests(q));
}

export async function patchBoardQuest(
  boardId: string,
  questId: string,
  updates: Partial<Quest>,
): Promise<Quest> {
  const res = await fetch(`/api/boards/${boardId}/quests/${questId}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  await throwIfUnauthorized(res);
  const json = (await res.json().catch(() => null)) as unknown;
  if (!res.ok) {
    const err =
      json && typeof json === "object" && "error" in json
        ? String((json as { error?: unknown }).error ?? "")
        : "";
    throw new Error(err || `patch quest failed: ${res.status}`);
  }
  if (!json || typeof json !== "object") throw new Error("invalid_response");
  const quest = (json as { quest?: Quest }).quest;
  if (!quest) throw new Error("invalid_response");
  return coerceQuestCategoryAndSubquests(quest as Quest);
}

export async function fetchBoardMembers(boardId: string): Promise<BoardMember[]> {
  const res = await fetch(`/api/boards/${boardId}/members`, {
    credentials: "include",
  });
  await throwIfUnauthorized(res);
  if (!res.ok) throw new Error(`members fetch failed: ${res.status}`);
  const json = (await res.json().catch(() => null)) as unknown;
  if (!json || typeof json !== "object") return [];
  const members = (json as { members?: unknown }).members;
  return Array.isArray(members) ? (members as BoardMember[]) : [];
}

export async function inviteBoardMember(
  boardId: string,
  userCode: string,
): Promise<void> {
  const res = await fetch(`/api/boards/${boardId}/members`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userCode }),
  });
  await throwIfUnauthorized(res);
  if (!res.ok) {
    const json = (await res.json().catch(() => null)) as unknown;
    const err =
      json && typeof json === "object" && "error" in json
        ? String((json as { error?: unknown }).error ?? "")
        : "";
    throw new Error(err || `invite failed: ${res.status}`);
  }
}

export async function removeBoardMember(boardId: string, userCode: string): Promise<void> {
  const res = await fetch(`/api/boards/${boardId}/members`, {
    method: "DELETE",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userCode }),
  });
  await throwIfUnauthorized(res);
  if (!res.ok) {
    const json = (await res.json().catch(() => null)) as unknown;
    const err =
      json && typeof json === "object" && "error" in json
        ? String((json as { error?: unknown }).error ?? "")
        : "";
    throw new Error(err || `remove member failed: ${res.status}`);
  }
}

export async function createBoard(name: string): Promise<string> {
  const res = await fetch(`/api/me/boards`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  await throwIfUnauthorized(res);
  const json = (await res.json().catch(() => null)) as unknown;
  if (!res.ok) {
    const err =
      json && typeof json === "object" && "error" in json
        ? String((json as { error?: unknown }).error ?? "")
        : "";
    throw new Error(err || `create board failed: ${res.status}`);
  }
  if (!json || typeof json !== "object") throw new Error("invalid_response");
  const id = (json as { boardId?: unknown }).boardId;
  if (typeof id !== "string" || !id) throw new Error("invalid_response");
  return id;
}

export async function createBoardQuest(
  boardId: string,
  quest: Omit<Quest, "id" | "createdAt" | "status" | "acceptedAt" | "acceptedByUserId">,
): Promise<Quest> {
  const res = await fetch(`/api/boards/${boardId}/quests`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quest }),
  });
  await throwIfUnauthorized(res);
  const json = (await res.json().catch(() => null)) as unknown;
  if (!res.ok) {
    const err =
      json && typeof json === "object" && "error" in json
        ? String((json as { error?: unknown }).error ?? "")
        : "";
    throw new Error(err || `create quest failed: ${res.status}`);
  }
  if (!json || typeof json !== "object") throw new Error("invalid_response");
  const q = (json as { quest?: Quest }).quest;
  if (!q) throw new Error("invalid_response");
  return coerceQuestCategoryAndSubquests(q as Quest);
}





async function postAction(
  url: string,
  body?: unknown,
): Promise<{ quest?: Quest; quests?: Quest[] }> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    if (isSessionExpiredError(e)) throw e;
    throw e;
  }
  await throwIfUnauthorized(res);
  const json = (await res.json().catch(() => null)) as unknown;
  if (!res.ok) {
    const err =
      json && typeof json === "object" && "error" in json
        ? String((json as { error?: unknown }).error ?? "")
        : "";
    throw new Error(err || `request failed: ${res.status}`);
  }
  if (!json || typeof json !== "object") return {};
  const obj = json as { quest?: unknown; quests?: unknown };
  const questRaw = obj.quest;
  const questsRaw = obj.quests;
  return {
    quest:
      questRaw && typeof questRaw === "object"
        ? coerceQuestCategoryAndSubquests(questRaw as Quest)
        : undefined,
    quests: Array.isArray(questsRaw)
      ? (questsRaw as Quest[]).map((q) => coerceQuestCategoryAndSubquests(q))
      : undefined,
  };
}

export async function acceptSharedQuest(boardId: string, questId: string) {
  return postAction(`/api/boards/${boardId}/quests/${questId}/accept`);
}

export async function completeSharedQuest(boardId: string, questId: string) {
  return postAction(`/api/boards/${boardId}/quests/${questId}/complete`);
}

export async function failSharedQuest(boardId: string, questId: string) {
  return postAction(`/api/boards/${boardId}/quests/${questId}/fail`);
}

export async function pinSharedQuest(
  boardId: string,
  questId: string,
  pinned: boolean,
) {
  return postAction(`/api/boards/${boardId}/quests/${questId}/pin`, { pinned });
}

export async function reorderSharedPins(
  boardId: string,
  orderedQuestIds: string[],
) {
  return postAction(`/api/boards/${boardId}/pins`, { orderedQuestIds });
}

export async function fetchBoardActivity(
  boardId: string,
  params: { beforeId?: number | null; limit?: number } = {},
): Promise<{ events: BoardActivityEvent[]; nextBeforeId: number | null }> {
  const beforeId = params.beforeId ?? null;
  const limit = params.limit ?? 30;
  const search = new URLSearchParams();
  search.set("limit", String(limit));
  if (beforeId !== null) search.set("beforeId", String(beforeId));

  const res = await fetch(`/api/boards/${boardId}/activity?${search.toString()}`, {
    credentials: "include",
  });
  await throwIfUnauthorized(res);
  if (!res.ok) throw new Error(`activity fetch failed: ${res.status}`);

  const json = (await res.json().catch(() => null)) as unknown;
  if (!json || typeof json !== "object") return { events: [], nextBeforeId: null };
  const obj = json as { events?: unknown; nextBeforeId?: unknown; ok?: unknown };
  const events = Array.isArray(obj.events) ? (obj.events as unknown[]) : [];

  const normalized: BoardActivityEvent[] = events
    .map((e) => {
      if (!e || typeof e !== "object") return null;
      const ev = e as {
        id?: unknown;
        boardId?: unknown;
        type?: unknown;
        payload?: unknown;
        createdAt?: unknown;
      };
      const id = typeof ev.id === "number" ? ev.id : Number(ev.id);
      if (!Number.isFinite(id)) return null;

      return {
        id,
        boardId: typeof ev.boardId === "string" ? ev.boardId : boardId,
        type: typeof ev.type === "string" ? ev.type : "unknown",
        payload: (ev.payload && typeof ev.payload === "object"
          ? ev.payload
          : {}) as Record<string, unknown>,
        createdAt: Number(ev.createdAt),
      };
    })
    .filter(Boolean) as BoardActivityEvent[];

  const nextBeforeId =
    obj.nextBeforeId === null || obj.nextBeforeId === undefined
      ? null
      : typeof obj.nextBeforeId === "number"
        ? obj.nextBeforeId
        : Number(obj.nextBeforeId);

  return { events: normalized, nextBeforeId: Number.isFinite(nextBeforeId as number) ? (nextBeforeId as number) : null };
}

export async function getBoardInvites(){
  const res = await fetch("/api/me/board-invites", { credentials: "include" });
  await throwIfUnauthorized(res);
  if(!res.ok) throw new Error(`invites fetch failed: ${res.status}`);
  const json = await res.json();
  return json.invites || [];
}

export async function acceptBoardInvite(inviteId: string){
  const res = await fetch(`/api/me/board-invites/${inviteId}/accept`, {
    method: "POST",
    credentials: "include",
  });
  await throwIfUnauthorized(res);
  if(!res.ok) throw new Error(`accept invite failed: ${res.status}`);
}

export async function declineBoardInvite(inviteId: string){
  const res = await fetch(`/api/me/board-invites/${inviteId}/decline`, {
    method: "POST",
    credentials: "include",
  });
  await throwIfUnauthorized(res);
  if(!res.ok) throw new Error(`decline invite failed: ${res.status}`);
}
