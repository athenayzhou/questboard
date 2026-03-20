import { clearLocalQuestboardState } from "@/lib/clearLocalQuestboardState";

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

/** Called after a successful authenticated bootstrap/sign-in. */
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
    import("@/lib/apiPlayer"),
    import("@/lib/apiSkills"),
    import("@/lib/apiXPEvents"),
    import("@/lib/apiExtension"),
  ]);
  q.setQuestSyncSuppressed(suppressed);
  p.setPlayerSyncSuppressed(suppressed);
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
      clearLocalQuestboardState({ quietWrites: true });
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

/** 401 from API — cookie cleared, local state wiped, back to invite gate. */
export function performSessionExpiryFlow(): Promise<void> {
  if (sessionExpiryHandled) {
    return recoveryInflight ?? Promise.resolve();
  }
  sessionExpiryHandled = true;
  return runSessionTermination();
}

/** Settings — user chose sign out. */
export function signOutFromApp(): Promise<void> {
  return runSessionTermination();
}

/**
 * Call from API save helpers when `Response.status === 401`.
 */
export async function throwIfUnauthorized(res: Response): Promise<void> {
  if (res.status === 401) {
    if (!sessionExpiryHandled) {
      await performSessionExpiryFlow();
    }
    throw new SessionExpiredError();
  }
}
