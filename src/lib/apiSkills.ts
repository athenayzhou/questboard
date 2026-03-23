import { useSkillStore } from "@/store/skill";
import { notifyDebouncedSyncFailure } from "@/lib/syncNotify";
import { isSessionExpiredError } from "@/lib/sessionRecovery";

let suppressSkillSync = false;
let timer: ReturnType<typeof setTimeout> | null = null;
const DELAY_MS = 800;

export function setSkillSyncSuppressed(suppressed: boolean) {
  suppressSkillSync = suppressed;
  if(suppressed && timer){
    clearTimeout(timer);
    timer = null;
  }
}

export async function saveSkillsToServer(skills: Record<string, unknown>) {
  const res = await fetch("/api/me/skills", {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ skills }),
  });
  if(!res.ok){
    const t = await res.text().catch(() => "");
    throw new Error(`save skills failed: ${res.status} ${t}`);
  }
}

export function scheduleSkillSync() {
  if(suppressSkillSync) return;
  if(timer) clearTimeout(timer);

  timer = setTimeout(async () => {
    timer = null;
    if(suppressSkillSync) return;
    const skills = useSkillStore.getState().skills;
    try {
      await saveSkillsToServer(skills);
    } catch (e) {
      if (isSessionExpiredError(e)) return;
      console.error(e);
      notifyDebouncedSyncFailure();
    }
  }, DELAY_MS);
}