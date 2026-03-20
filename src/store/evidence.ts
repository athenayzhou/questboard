import type { Evidence } from "../types/skills";
import { DEFAULT, MS } from "../utils/constants";
import { devLog } from "../dev/devLogs";

const MAX_EVIDENCE = 1000;
const MAX_AGE_DAYS = 90;

function touchExtension() {
  void import("@/lib/apiExtension").then((m) => m.scheduleExtensionSync());
}

export class EvidenceStore {
  private evidence: Evidence[] = [];

  constructor() {
    this.pruneOld();
  }

  private pruneOld() {
    const now = Date.now();
    const maxAgeMS = MAX_AGE_DAYS * MS.DAY;
    const before = this.evidence.length;
    this.evidence = this.evidence
      .filter((e) => now - e.timestamp <= maxAgeMS)
      .slice(-MAX_EVIDENCE);
    const after = this.evidence.length;
    if (before !== after) {
      devLog("evidence", "pruned evidence", { before, after });
    }
  }

  hydrate(items: unknown) {
    this.evidence = Array.isArray(items) ? (items as Evidence[]) : [];
    this.pruneOld();
  }

  getAll(): Evidence[] {
    return this.evidence;
  }

  add(props: {
    verb: string;
    object: string;
    origin: string;
    timespent?: number;
    timestamp?: number;
  }) {
    const inferredTime = props.timespent ?? DEFAULT.EFFORT;
    const now = props.timestamp ?? Date.now();

    const item: Evidence = {
      id: crypto.randomUUID(),
      verb: props.verb,
      object: props.object,
      origin: props.origin,
      timespent: inferredTime,
      timestamp: now,
    };

    this.evidence.push(item);
    devLog(
      "skill-gen",
      `evidence recorded {${item.verb}:${item.object}} from "${item.origin}"`,
    );
    this.pruneOld();
    touchExtension();
  }

  clear() {
    this.evidence = [];
    devLog("evidence", "cleared evidence");
    touchExtension();
  }
}
