import { useEffect, useRef } from "react";
import type { Quest } from "@/types/quest";
import { useQuestStore } from "@/store/quest";
import { useIdentityStore } from "@/store/identity";
import { showToast } from "@/utils/toast";
import { isSystemGeneratedQuest } from "@/lib/computeQuestReward";

function toastMessageForInboundQuest(q: Quest, userCode: string | null): string | null {
  if (q.collabQuest && q.collabInvitePending) {
    return `collab invitation: ${q.title}`;
  }
  const sentBy = q.sentByUserId?.trim();
  if (sentBy && sentBy !== userCode) {
    const who = q.sentByName?.trim() || sentBy;
    return `quest from ${who}: ${q.title}`;
  }
  if (isSystemGeneratedQuest(q)) {
    return `new quest: ${q.title}`;
  }
  return null;
}

/**
 * After bootstrap, when new quests appear (sync, invites, system generation), toast for
 * inbound cases: friend-sent, system-generated, or pending collab invite.
 */
export function useInboundQuestToasts(bootstrapReady: boolean) {
  const quests = useQuestStore((s) => s.quests);
  const userCode = useIdentityStore((s) => s.userCode);
  const seededRef = useRef(false);
  const seenIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!bootstrapReady) return;

    if (!seededRef.current) {
      const latest = useQuestStore.getState().quests;
      for (const q of latest) {
        seenIdsRef.current.add(q.id);
      }
      seededRef.current = true;
      return;
    }

    for (const q of quests) {
      if (seenIdsRef.current.has(q.id)) continue;
      seenIdsRef.current.add(q.id);
      const msg = toastMessageForInboundQuest(q, userCode);
      if (msg) showToast("info", msg);
    }
  }, [bootstrapReady, quests, userCode]);
}
