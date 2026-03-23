import { clearLocalState } from "@/lib/clearLocalState";

export class SessionExpiredError extends Error {
  constructor() {
    super("session_expired");
    this.name = "SessionExpiredError";
  }
}

export function isSessionExpiredError(e: unknown): boolean {
  return e instanceof SessionExpiredError;
}

let bootstrapRetry: (() => void) | null = null;
let recoveryInflight: Promise<void> | null = null;
let sessionExpiryHandled = false;

export function registerBootstrapRetry(fn: (() => void) | null) {
  bootstrapRetry = fn;
}

export function resetSessionExpiryState() {
  sessionExpiryHandled = false;
}

async function clearHttpSessionCookie(): Promise<void> {
  await fetch("/api/beta/signout", {
    method: "POST",
    credentials: "include",
  }).catch(() => undefined);
}

async function setAllServerSyncSuppressed(suppressed: boolean): Promise<void> {
  const [q, p, sk, xp, ext] = await Promise.all([
    import("@/lib/apiQuests"),
    import("@/lib/apiUser"),
    import("@/lib/apiSkills"),
    import("@/lib/apiXPEvents"),
    import("@/lib/apiExtension"),
  ]);
  q.setQuestSyncSuppressed(suppressed);
  p.setUserSyncSuppressed(suppressed);
  sk.setSkillSyncSuppressed(suppressed);
  xp.setXPEventSyncSuppressed(suppressed);
  ext.setExtensionSyncSuppressed(suppressed);
}

async function runSessionTermination(): Promise<void> {
  if (recoveryInflight) return recoveryInflight;

  const p = (async () => {
    await setAllServerSyncSuppressed(true);
    try {
      await clearHttpSessionCookie();
      clearLocalState({ quietWrites: true });
      bootstrapRetry?.();
    } finally {
      await setAllServerSyncSuppressed(false);
    }
  })().finally(() => {
    recoveryInflight = null;
  });

  recoveryInflight = p;
  return p;
}

export function performSessionExpiryFlow(): Promise<void> {
  if (sessionExpiryHandled) {
    return recoveryInflight ?? Promise.resolve();
  }
  sessionExpiryHandled = true;
  return runSessionTermination();
}

export function signOutFromApp(): Promise<void> {
  return runSessionTermination();
}

export async function throwIfUnauthorized(res: Response): Promise<void> {
  if (res.status === 401) {
    if (!sessionExpiryHandled) {
      await performSessionExpiryFlow();
    }
    throw new SessionExpiredError();
  }
}
