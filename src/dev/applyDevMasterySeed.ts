import {
  RICH_DEV_MASTERIES,
  RICH_DEV_SKILLS,
} from "@/dev/data/richDevSeedData";
import { useMasteryStore } from "@/store/mastery";
import { useSkillStore } from "@/store/skill";

function verbKey(v: string | undefined) {
  return (v ?? "").toLowerCase().trim();
}

/**
 * In `next dev`, merges demo skills + masteries from `richDevSeedData.ts` so the skill
 * ledger “mastery” section has paths to click (with contributing skills).
 * Skips masteries whose verb already exists (server / blob data wins).
 * No-op when `NODE_ENV !== "development"`.
 */
export function applyDevMasterySeed(): void {
  if (process.env.NODE_ENV !== "development") return;

  useSkillStore.setState((s) => ({
    skills: { ...s.skills, ...RICH_DEV_SKILLS },
  }));

  useMasteryStore.setState((state) => {
    const existingVerbs = new Set(state.masteries.map((m) => verbKey(m.verb)));
    const additions = RICH_DEV_MASTERIES.filter(
      (m) => !existingVerbs.has(verbKey(m.verb)),
    );
    if (additions.length === 0) return state;
    return { masteries: [...state.masteries, ...additions] };
  });

  useMasteryStore.getState().reconcileAllMasteriesWithSkills();
}
