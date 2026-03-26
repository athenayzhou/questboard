import type { Quest } from "@/types/quest";
import type { SharedBoard } from "@/types/board";
import {
  isSessionExpiredError,
  throwIfUnauthorized,
} from "@/lib/sessionRecovery";

export async function fetchMyBoards(): Promise<SharedBoard[]> {
  const res = await fetch("/api/me/boards", { credentials: "include" });
  await throwIfUnauthorized(res);
  if (!res.ok) throw new Error(`boards fetch failed: ${res.status}`);
  const json = (await res.json().catch(() => null)) as unknown;
  if (!json || typeof json !== "object") return [];
  const boards = (json as { boards?: unknown }).boards;
  return Array.isArray(boards) ? (boards as SharedBoard[]) : [];
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
  return Array.isArray(quests) ? (quests as Quest[]) : [];
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
  return (json as { quest?: Quest }).quest as Quest;
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
  return {
    quest: obj.quest as Quest | undefined,
    quests: obj.quests as Quest[] | undefined,
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

