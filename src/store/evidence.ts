import type { Evidence } from "../types/skills";
import { DEFAULT, MS } from "../utils/constants";
import { devLog, devError } from "../dev/devLogs";

const STORAGE_KEY = "evidence";
const MAX_EVIDENCE = 1000;
const MAX_AGE_DAYS = 90;

export class EvidenceStore {
  private evidence: Evidence[] = [];

  constructor() {
    this.loadFromStorage();
    this.pruneOld();
  }

  private loadFromStorage(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      if(!raw){
        devLog("evidence", "no existing evidence in storage");
        this.evidence = [];
        return;
      }
      const parsed = JSON.parse(raw) as Evidence[];
      this.evidence = Array.isArray(parsed) ? parsed : [];
      devLog("evidence", "loaded evidence from storage", { count: this.evidence.length });
    } catch (error) {
      this.evidence = [];
      devError('evidence', 'failed to load evidence from storage', error);
    }
  }

  private pruneOld() {
    const now = Date.now();
    const maxAgeMS = MAX_AGE_DAYS * MS.DAY;
    const before = this.evidence.length;
    this.evidence = this.evidence
    .filter(e => now - e.timestamp <= maxAgeMS)
    .slice(-MAX_EVIDENCE);
    const after = this.evidence.length;
    if(before !== after){
      devLog('evidence', 'pruned evidence', { before, after })
    }
  }

  private persist() {
    this.pruneOld();
    try{
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.evidence));
      devLog('evidence', 'persisted evidence', { count: this.evidence.length });
    } catch (error) {
      devError('evidence', 'failed to persist evidence', error);
    }
  }

  getAll(): Evidence[] {
    return this.evidence;
  }

  add(props: {
    verb: string,
    object: string,
    origin: string,
    timespent?: number,
    timestamp?: number,
  }) {
    const inferredTime = props.timespent ?? DEFAULT.EFFORT;
    const now = props.timestamp ?? Date.now();

    const item: Evidence = {
      id: crypto.randomUUID(),
      verb: props.verb,
      object: props.object,
      origin: props.origin,
      timespent:inferredTime,
      timestamp: now,
    }

    this.evidence.push(item);
    devLog('evidence', 'added evidence', {
      verb: item.verb,
      object: item.object,
      origin: item.origin,
      timespent: item.timespent,
    });
    this.persist();
  }

  clear() {
    this.evidence = [];
    try{
      localStorage.removeItem(STORAGE_KEY);
      devLog('evidence', 'cleared evidence');
    } catch (error) {
      devError('evidence', 'failed to clear evidence from storage', error)
    }
  }

}