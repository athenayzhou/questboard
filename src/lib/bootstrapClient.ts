import type { Quest } from "@/types/quest";
import type { UserData } from "@/types/user";
import { normalizeUserData } from "@/lib/userData";
import type { Skill, XPEvent } from "@/types/skills";
import { setQuestSyncSuppressed } from "@/lib/apiQuests";
import { setUserSyncSuppressed } from "@/lib/apiUser";
import { setSkillSyncSuppressed } from "@/lib/apiSkills";
import { setXPEventSyncSuppressed } from "@/lib/apiXPEvents";
import { setExtensionSyncSuppressed } from "@/lib/apiExtension";
import {
  applyClientGameBlob,
  normalizeClientGameBlob,
} from "@/lib/clientExtensionPayload";
import { resetSessionExpiryState } from "@/lib/sessionRecovery";
import { useQuestStore } from "@/store/quest";
import { useUserStore } from "@/store/user";
import { useSkillStore } from "@/store/skill";
import { useXPEventStore } from "@/store/xpEvent";
import { useIdentityStore } from "@/store/identity";
import { ensureGoldieFriend } from "@/lib/ensureGoldieFriend";

export type BootstrapStatus =
  | "idle"
  | "loading"
  | "ready"
  | "unauthorized"
  | "error";

export class BootstrapNetworkError extends Error {
  constructor() {
    super("Failed to reach the server");
    this.name = "BootstrapNetworkError";
  }
}

type BootstrapData = {
  user: unknown;
  quests: unknown;
  skills: unknown;
  xpEvents: unknown;
  clientGame?: unknown;
  userCode?: unknown;
};

type BootstrapOkResponse = {
  ok: true;
  data: BootstrapData;
};

type BootstrapErrResponse = {
  ok: false;
  error?: string;
};

function normalizeUser(raw: unknown): UserData {
  return normalizeUserData(raw);
}

function normalizeQuests(raw: unknown): Quest[] {
  if (!Array.isArray(raw)) return [];
  return raw as Quest[];
}

function normalizeSkills(raw: unknown): Record<string, Skill> {
  if (!raw || typeof raw !== "object") return {};
  return raw as Record<string, Skill>;
}

function normalizeXPEvents(raw: unknown): XPEvent[] {
  if (!Array.isArray(raw)) return [];
  return raw as XPEvent[];
}

function applyBootstrapData(data: BootstrapData) {
  const quests = normalizeQuests(data.quests);
  const user = normalizeUser(data.user);
  const skills = normalizeSkills(data.skills);
  const events = normalizeXPEvents(data.xpEvents);

  setQuestSyncSuppressed(true);
  setUserSyncSuppressed(true);
  setSkillSyncSuppressed(true);
  setXPEventSyncSuppressed(true);
  setExtensionSyncSuppressed(true);
  try {
    useQuestStore.getState().setQuest(quests);
    useUserStore.getState().setUser(user);
    useSkillStore.setState({ skills });
    useXPEventStore.setState({ events });
    applyClientGameBlob(normalizeClientGameBlob(data.clientGame));
    ensureGoldieFriend();
    useIdentityStore.getState().setUserCode(typeof data.userCode === "string" ? data.userCode : null)
  } finally {
    setQuestSyncSuppressed(false);
    setUserSyncSuppressed(false);
    setSkillSyncSuppressed(false);
    setXPEventSyncSuppressed(false);
    setExtensionSyncSuppressed(false);
  }
}

export async function fetchBootstrapOnce(): Promise<BootstrapStatus> {
  let res: Response;
  try {
    res = await fetch("/api/me/bootstrap", { credentials: "include" });
  } catch {
    throw new BootstrapNetworkError();
  }

  if (res.status === 401) {
    return "unauthorized";
  }

  let json: BootstrapOkResponse | BootstrapErrResponse;
  try {
    json = (await res.json()) as BootstrapOkResponse | BootstrapErrResponse;
  } catch {
    return "error";
  }

  if (!res.ok || !json.ok || !("data" in json) || !json.data) {
    return "error";
  }

  applyBootstrapData(json.data);
  resetSessionExpiryState();
  return "ready";
}
