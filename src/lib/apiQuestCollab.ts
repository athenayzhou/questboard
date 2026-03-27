import type { Quest } from "@/types/quest";
import { isPersonalQuest } from "@/lib/boardScope";
import { dedupeQuestsById } from "@/lib/questDedupe";
import { throwIfUnauthorized, isSessionExpiredError } from "./sessionRecovery";

export type PendingQuestInvite = {
  id: string;
  quest_id: string;
  quest_title: string | null;
  /** Full shared quest JSON (preview for invitee before accept). */
  quest_data?: unknown;
  inviter_name: string | null;
  created_at: string;
};

/** One in-flight GET for invites+collabs so parallel callers share a single HTTP request. */
let questCollabStateInflight: Promise<{
  invites: PendingQuestInvite[];
  collabs: Quest[];
}> | null = null;

/** Clears coalescing so the next fetch sees latest server state (mutations, SSE). */
export function invalidateQuestCollabStateInflight() {
  questCollabStateInflight = null;
}

async function postAction<T = unknown>(url: string, body?: unknown) {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    if (isSessionExpiredError(e)) throw e;
    throw e;
  }

  await throwIfUnauthorized(res);

  const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  if (!res.ok) {
    const err =
      json && typeof json === "object" && "error" in json
        ? String((json as { error?: unknown }).error ?? "")
        : "";
    throw new Error(err || `request failed: ${res.status}`);
  }
  return json as T;
}

export async function inviteQuestCollaborator(args: {
  questId: string;
  toUserCode: string;
}): Promise<{ inviteId: string; quest: Quest }> {
  const json = await postAction<{
    ok?: boolean;
    inviteId?: string;
    quest?: Quest;
  }>("/api/me/quest-collabs/invite", args);
  if (!json?.quest || typeof json.inviteId !== "string") {
    throw new Error("invalid_response");
  }
  return { inviteId: json.inviteId, quest: { ...json.quest, myState: "active" } };
}

async function loadQuestCollabState(): Promise<{
  invites: PendingQuestInvite[];
  collabs: Quest[];
}> {
  if (!questCollabStateInflight) {
    questCollabStateInflight = (async () => {
      const res = await fetch("/api/me/quest-collab-state", {
        credentials: "include",
      });
      await throwIfUnauthorized(res);
      if (!res.ok) throw new Error(`fetch collab state failed: ${res.status}`);
      const json = (await res.json().catch(() => null)) as {
        invites?: unknown;
        quests?: unknown;
      } | null;
      const invites = Array.isArray(json?.invites)
        ? (json!.invites as PendingQuestInvite[])
        : [];
      const collabs = Array.isArray(json?.quests)
        ? (json!.quests as Quest[])
        : [];
      return { invites, collabs };
    })().finally(() => {
      questCollabStateInflight = null;
    });
  }
  return questCollabStateInflight;
}

/** Pending invites + collab quests in one GET (same data as separate endpoints). */
export async function fetchQuestCollabState(): Promise<{
  invites: PendingQuestInvite[];
  collabs: Quest[];
}> {
  return loadQuestCollabState();
}

export async function fetchQuestCollabs(): Promise<Quest[]> {
  const s = await loadQuestCollabState();
  return s.collabs;
}

export function shellQuestFromPendingInvite(inv: PendingQuestInvite): Quest {
  const raw = inv.quest_data;
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const base = raw as Partial<Quest> & Record<string, unknown>;
    const title =
      (typeof base.title === "string" && base.title.trim()
        ? base.title
        : null) ??
      inv.quest_title ??
      "quest invitation";
    return {
      ...base,
      id: inv.quest_id,
      title,
      description:
        typeof base.description === "string" ? base.description : undefined,
      difficulty: base.difficulty ?? "medium",
      status: "available",
      createdAt:
        typeof base.createdAt === "number"
          ? base.createdAt
          : Date.parse(inv.created_at) || Date.now(),
      reward: base.reward,
      collabQuest: true,
      collabInvitePending: true,
      collabInviteId: inv.id,
      boardId: null,
      acceptedAt: undefined,
      acceptedByUserId: undefined,
    } as Quest;
  }
  return {
    id: inv.quest_id,
    title: inv.quest_title ?? "quest invitation",
    description: inv.inviter_name
      ? `collaboration invite from ${inv.inviter_name}`
      : undefined,
    difficulty: "medium",
    status: "available",
    createdAt: Date.parse(inv.created_at) || Date.now(),
    collabQuest: true,
    collabInvitePending: true,
    collabInviteId: inv.id,
  };
}

/** Replaces all collab quest rows with shells + accepted collab quests from server. Keeps personal & board quests. */
export function mergeCollabQuestSlices(
  quests: Quest[],
  invites: PendingQuestInvite[],
  collabs: Quest[],
): Quest[] {
  const personalAndBoard = quests.filter((q) => !q.collabQuest);
  const shells = invites.map(shellQuestFromPendingInvite);
  return dedupeQuestsById([...personalAndBoard, ...shells, ...collabs]);
}

/**
 * Merges GET /api/me/quests with current client state so quests not yet persisted
 * (e.g. just added before debounced sync) are not wiped by the quest-board poll.
 */
export function mergeQuestStateFromServer(
  prev: Quest[],
  serverPersonal: Quest[],
  invites: PendingQuestInvite[],
  collabs: Quest[],
): Quest[] {
  const serverIds = new Set(serverPersonal.map((q) => q.id));
  const localPersonalOnly = prev.filter(
    (q) => isPersonalQuest(q) && !serverIds.has(q.id),
  );
  const boardNonCollab = prev.filter((q) => Boolean(q.boardId) && !q.collabQuest);
  const base = dedupeQuestsById([
    ...serverPersonal,
    ...localPersonalOnly,
    ...boardNonCollab,
  ]);
  return mergeCollabQuestSlices(base, invites, collabs);
}

export async function fetchQuestInvites(): Promise<PendingQuestInvite[]> {
  const s = await loadQuestCollabState();
  return s.invites;
}

export async function acceptQuestInvite(inviteId: string) {
  await postAction(`/api/me/quest-invites/${inviteId}/accept`);
}

export async function declineQuestInvite(inviteId: string) {
  await postAction(`/api/me/quest-invites/${inviteId}/decline`);
}

export async function toggleQuestSubquest(args: {
  questId: string;
  subquestId: string;
  completed: boolean;
}): Promise<{ quest?: Quest }> {
  return postAction(
    `/api/me/quests/${encodeURIComponent(args.questId)}/collab/subquests/${encodeURIComponent(args.subquestId)}/toggle`,
    { completed: args.completed },
  );
}

export async function completeQuestForAll(questId: string): Promise<{ quest?: Quest }> {
  return postAction(`/api/me/quests/${encodeURIComponent(questId)}/collab/complete`);
}

export async function giveUpQuest(questId: string) {
  return postAction(`/api/me/quests/${encodeURIComponent(questId)}/collab/give-up`);
}

export function subscribeQuestCollabEvents(args: {
  questId: string;
  cursor: number;
  onEvent: (ev: { id: number; type: string; payload: Record<string, unknown>; ts: number }) => void;
  onError?: (err: unknown) => void;
}): () => void {
  const es = new EventSource(
    `/api/me/quests/${encodeURIComponent(args.questId)}/collab/events?cursor=${args.cursor}`,
  );

  es.addEventListener("quest-collab-event", (ev: MessageEvent) => {
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(String(ev.data ?? "{}")) as Record<string, unknown>;
    } catch {
      return;
    }
    const id = typeof parsed.id === "number" ? parsed.id : Number(parsed.id);
    if (!Number.isFinite(id)) return;

    args.onEvent({
      id,
      type: String(parsed.type ?? "unknown"),
      payload:
        parsed.payload && typeof parsed.payload === "object"
          ? (parsed.payload as Record<string, unknown>)
          : {},
      ts: Number(parsed.ts ?? Date.now()),
    });
  });

  es.addEventListener("error", () => {
    args.onError?.({ error: "sse_error" });
  });

  return () => es.close();
}
