import type { Quest } from "../types/quest";

export function questProgress(quest: Quest){
  if(!quest.subquests || quest.subquests.length === 0) return null;

  const completed = quest.subquests.filter(s => s.completed).length;
  const total = quest.subquests.length;

  return {
    completed,
    total,
    ratio: completed/total,
  }
}