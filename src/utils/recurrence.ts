import type { Quest } from "../types/quest";
import { MS } from "./constants";

/** Local calendar day as YYYY-MM-DD */
function localDateKey(t: number): string {
  const d = new Date(t);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Format deadline for display. YYYY-MM-DD from date inputs must not use
 * `new Date("YYYY-MM-DD")` (UTC midnight → wrong local calendar day).
 */
export function formatDeadlineForDisplay(
  deadline: string | null | undefined
): string {
  if (deadline == null || String(deadline).trim() === "") return "";
  const raw = String(deadline).trim();
  const ymd = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymd) {
    const y = Number(ymd[1]);
    const mo = Number(ymd[2]) - 1;
    const day = Number(ymd[3]);
    const d = new Date(y, mo, day);
    if (!Number.isNaN(d.getTime())) return d.toLocaleDateString();
  }
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? raw : d.toLocaleDateString();
}

/** Compact **MM/DD/YYYY** for board cards (parses `YYYY-MM-DD` as local calendar day). */
export function formatDeadlineMDY(
  deadline: string | null | undefined
): string {
  if (deadline == null || String(deadline).trim() === "") return "";
  const raw = String(deadline).trim();
  const ymd = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymd) {
    return `${ymd[2]}/${ymd[3]}/${ymd[1]}`;
  }
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const y = String(d.getFullYear());
  return `${m}/${day}/${y}`;
}

/** End of local calendar day for deadline string (date input / ISO date) */
export function getQuestDueBy(quest: Quest): number | null {
  if (quest.deadline) {
    const raw = String(quest.deadline).trim();
    // YYYY-MM-DD from <input type="date"> — parse as local midnight so "due day" matches user
    const ymd = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (ymd) {
      const y = Number(ymd[1]);
      const mo = Number(ymd[2]) - 1;
      const day = Number(ymd[3]);
      const d = new Date(y, mo, day, 23, 59, 59, 999);
      if (!Number.isNaN(d.getTime())) return d.getTime();
    }
    const d = new Date(quest.deadline);
    if (!Number.isNaN(d.getTime())) return d.setHours(23, 59, 59, 999);
  }
  if (quest.frequency && quest.frequency !== "once") {
    return RecurringQuests.getNextDueDate(quest.frequency, quest.createdAt, quest.customFrequency);
  }
  return null;
}

export function isQuestOverdue(quest: Quest): boolean {
  if (quest.deadline) {
    const raw = String(quest.deadline).trim();
    const ymd = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (ymd) {
      const dueKey = `${ymd[1]}-${ymd[2]}-${ymd[3]}`;
      const todayKey = localDateKey(Date.now());
      // Not late on the due calendar day (or before)
      if (todayKey <= dueKey) return false;
      return true;
    }
  }
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