import type { Quest } from "../types/quest";
import { MS } from "./constants";

export function getQuestDueBy(quest: Quest): number | null {
  if (quest.deadline) {
    const d = new Date(quest.deadline);
    if (!Number.isNaN(d.getTime())) return d.setHours(23, 59, 59, 999);
  }
  if (quest.frequency && quest.frequency !== "once") {
    return RecurringQuests.getNextDueDate(quest.frequency, quest.createdAt, quest.customFrequency);
  }
  return null;
}

export function isQuestOverdue(quest: Quest): boolean {
  const dueBy = getQuestDueBy(quest);
  return dueBy != null && Date.now() > dueBy;
}

export class RecurringQuests {
  static getNextDueDate(frequency: NonNullable<Quest['frequency']>, fromDate: number = Date.now(), customDays?: number): number {
    switch(frequency){
      case 'daily': return fromDate + MS.DAY;
      case 'weekly': return fromDate + (MS.DAY * 7);
      case 'monthly': return fromDate + (MS.DAY * 30);
      case 'custom': return fromDate + (MS.DAY * (customDays || 7));
      default: return 0;
    }
  }

  static shouldGenerateNext(quest: Quest): boolean {
    if(!quest.frequency || quest.frequency === 'once' || !quest.completedAt || quest.paused){
      return false;
    }
    const nextDue = quest.nextDueAt || this.getNextDueDate(quest.frequency, quest.createdAt, quest.customFrequency);
    return Date.now() >= nextDue;
  }

  static generateNextInstance(templateQuest: Quest): Quest {
    const now = Date.now();
    const nextDueAt = this.getNextDueDate(
      templateQuest.frequency!,
      now,
      templateQuest.customFrequency
    );
    const parentId =
      templateQuest.isTemplate
        ? templateQuest.id
        : (templateQuest.parentQuestId ?? templateQuest.id);

    return {
      ...templateQuest,
      id: crypto.randomUUID(),
      status: 'available' as const,
      createdAt: now,
      acceptedAt: undefined,
      completedAt: undefined,
      parentQuestId: parentId,
      nextDueAt,
      recurrenceCount: (templateQuest.recurrenceCount || 0) + 1,
      subquests: templateQuest.subquests?.map(sq => ({
        ...sq,
        id: crypto.randomUUID(),
        completed: false,
      })),
    };
  }
}