import type { BadgePlatePlacement, PlayerBadges } from "@/types/player";

/** Ring around the plate so defaults stay off the centered name. */
const GRID_SLOTS: Array<{ x: number; y: number }> = [
  { x: 0.1, y: 0.1 },
  { x: 0.35, y: 0.08 },
  { x: 0.65, y: 0.08 },
  { x: 0.9, y: 0.1 },
  { x: 0.1, y: 0.9 },
  { x: 0.35, y: 0.92 },
  { x: 0.65, y: 0.92 },
  { x: 0.9, y: 0.9 },
];

export function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

/** Default grid position for the badge at `index` in the displayed list (0-based). */
export function slotPlacementForIndex(
  index: number,
  id: string,
): BadgePlatePlacement {
  const s = GRID_SLOTS[index % GRID_SLOTS.length];
  return { id, x: s.x, y: s.y };
}

/**
 * Migrate server/local JSON: supports legacy `activeBadge` and fills missing placements.
 * Accepts either `badges` or legacy `achievements` blob (handled in `normalizePlayerData`).
 */
export function migrateBadges(raw: unknown): PlayerBadges {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const unlocked = Array.isArray(o.unlockedBadges)
    ? [...(o.unlockedBadges as string[])]
    : [];

  let displayed = Array.isArray(o.displayedBadgeIds)
    ? [...(o.displayedBadgeIds as string[])]
    : [];

  let placements: BadgePlatePlacement[] = Array.isArray(o.badgePlacements)
    ? (o.badgePlacements as BadgePlatePlacement[]).map((p) => ({
        id: String(p.id),
        x: clamp01(Number(p.x)),
        y: clamp01(Number(p.y)),
      }))
    : [];

  const legacy = o.activeBadge;
  if (
    typeof legacy === "string" &&
    legacy &&
    displayed.length === 0 &&
    placements.length === 0
  ) {
    displayed = [legacy];
    placements = [{ id: legacy, x: 0.9, y: 0.1 }];
  }

  displayed = [...new Set(displayed)].filter((id) => unlocked.includes(id));

  placements = placements.filter(
    (p) => unlocked.includes(p.id) && displayed.includes(p.id),
  );

  const seen = new Set<string>();
  placements = placements.filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });

  for (let i = 0; i < displayed.length; i++) {
    const id = displayed[i];
    if (!placements.some((p) => p.id === id)) {
      placements.push(slotPlacementForIndex(i, id));
    }
  }

  return {
    unlockedBadges: unlocked,
    displayedBadgeIds: displayed,
    badgePlacements: placements,
  };
}
