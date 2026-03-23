import type { Quest } from "@/types/quest";

export function dedupeQuestsById(quests: Quest[]): Quest[] {
  const map = new Map<string, Quest>();
  for (const q of quests) {
    map.set(q.id, q);
  }
  if (map.size === quests.length) return quests;
  return [...map.values()];
}
