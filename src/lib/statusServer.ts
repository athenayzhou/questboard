import type { FriendStatus } from "@/types/friend";

const ONLINE_THRESHOLD_SEC = 300;
const IDLE_THRESHOLD_SEC = 900;

export function statusFromSession(
  hasActiveSession: boolean,
  lastSeenAt: Date | null,
  nowMs: number = Date.now(),
): FriendStatus {
  if(!hasActiveSession) return "offline";

  if(!lastSeenAt || Number.isNaN(lastSeenAt.getTime())){
    return "idle";
  }

  const ageSec = (nowMs - lastSeenAt.getTime()) / 1000;
  if(ageSec < ONLINE_THRESHOLD_SEC) return "online";
  if(ageSec < IDLE_THRESHOLD_SEC) return "idle";
  return "idle";
}