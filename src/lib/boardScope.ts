import type { Quest } from "@/types/quest";

export function isPersonalQuest(q: Quest): boolean {
  return (q.boardId == null || q.boardId === "") && !q.collabQuest;
}

export function isQuestCollab(q: Quest): boolean {
  return q.collabQuest === true;
}

export function isSharedQuest(q: Quest): boolean {
  return !isPersonalQuest(q);
}

export function sharedQuests(quests: Quest[], boardId: string): Quest[]{
  return quests.filter((q) => q.boardId === boardId);
}

export function sharedBoardTerminalQuests(
  quests: Quest[],
  boardId: string,
): Quest[] {
  return sharedQuests(quests, boardId).filter(
    (q) => q.status === "completed" || q.status === "failed"
  )
}

export function userHasPin(
  q: Quest,
  userCode: string | null | undefined,
): boolean {
  if(!userCode || !q.boardId) return false;
  return q.sharedQuestPins?.[userCode]?.pinned === true;
}