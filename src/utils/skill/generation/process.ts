import type { Quest } from "../../../types/quest";
import type { Evidence } from "../../../types/skills";
import { EvidenceStore } from "../../../store/evidence";
import { extractPair } from "../../format/text";
import { devLog } from "../../../dev/devLogs";
import { DEFAULT, MS } from "../../constants";

export type ProcessResult ={
  evidence: Evidence[];
  keys: string[];
}

export function process(
  quest: Quest,
  evidenceStore: EvidenceStore,
): ProcessResult {
  const processed: ProcessResult["evidence"] = []
  const keys = new Set<string>();

  const pairs = extractPair(quest.title);
  devLog('skill-gen', `extractPair("${quest.title}") → ${pairs.length} VO pair(s): [${pairs.map(p => `${p.verb}:${p.object}`).join(", ")}]`);
  const now = Date.now();
  for (const {verb, object} of pairs){
    const timespent =
      quest.duration && quest.duration > 0
        ? quest.duration * MS.MINUTE
        : DEFAULT.EFFORT;
    const evidence: Evidence = {
      id: crypto.randomUUID(),
      verb,
      object,
      origin: `${quest.id}:${quest.title}`,
      timespent,
      timestamp: now,
    };
    evidenceStore.add(evidence);
    processed.push(evidence);
    keys.add(`${verb}:${object}`);
  }

  return { 
    evidence: processed, 
    keys: [...keys],
  }
}
