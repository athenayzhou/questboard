import type { Cluster, Candidate } from "../types/skills";
import { DECAY, MS } from "../utils/constants";
import { clamp } from "three/src/math/MathUtils.js";
import { devLog } from "../dev/devLogs";

export class CandidateStore {
  private candidates: Map<string, Candidate> = (() => {
    try {
      const raw = localStorage.getItem("candidates");
      return raw ? new Map(JSON.parse(raw)) : new Map();
    } catch {
      return new Map();
    }
  })();

  getAll() {
    return [...this.candidates.values()];
  }

  add(cluster: Cluster): Candidate {
    const key = `${cluster.verb}:${cluster.object}`;
    const existing = this.candidates.get(key);
    if(existing) {
      return this.update(existing, cluster);
    } else {
      return this.create(cluster);
    }
  }

  decay(now: number) {
    const toRemove: string[] = [];
    this.candidates.forEach(candidate => {
      const daysIdle = (now - candidate.lastSeenAt) / MS.DAY;
      if(daysIdle > DECAY.CANDIDATE_DECAY_IDLE_DAYS) {
        const decayAmount = daysIdle * DECAY.CANDIDATE_DECAY_RATE;
        const prevReadiness = candidate.readiness;
        candidate.readiness = clamp(prevReadiness - decayAmount, 0, 1);
        const daysUntilRemoval = Math.max(0, DECAY.CANDIDATE_REMOVAL_DAYS - daysIdle);
        devLog("decay", `candidate "${candidate.key}" decayed ⇒ -${decayAmount.toFixed(4)} decrease in readiness, readiness: ${candidate.readiness.toFixed(4)}, days idle: ${Math.floor(daysIdle)}, removal threshold: ${DECAY.CANDIDATE_REMOVAL_THRESHOLD}, days below threshold until removed: ${Math.floor(daysUntilRemoval)}`);
        if(candidate.readiness < DECAY.CANDIDATE_REMOVAL_THRESHOLD){
          candidate.state = "decayed";
          if(daysIdle > DECAY.CANDIDATE_REMOVAL_DAYS){
            toRemove.push(candidate.key);
          }
        }
      }
    });
    toRemove.forEach(key => this.candidates.delete(key));
    try {
      localStorage.setItem("candidates", JSON.stringify([...this.candidates]));
      // eslint-disable-next-line no-empty
    } catch {}
  }


  private create(cluster: Cluster, now = Date.now()): Candidate {
    const candidate: Candidate = {
      id: crypto.randomUUID(),
      key: `${cluster.verb}:${cluster.object}`,
      verb: cluster.verb,
      objects: [cluster.object],
      clusters: [cluster],
      xp: cluster.xp,
      readiness: 0,
      origin: [...cluster.origin],
      firstSeenAt: now,
      lastSeenAt: now,
      state: "latent",
    };
    this.candidates.set(candidate.key, candidate);
    return candidate;
  }

  private update(candidate: Candidate, cluster: Cluster, now = Date.now()): Candidate {
    if(!candidate.objects.includes(cluster.object)){
      candidate.objects.push(cluster.object);
    }
    if(!candidate.clusters.some(c => c.key === cluster.key)) {
      candidate.clusters.push({...cluster});
      candidate.xp += cluster.xp;
    }
    for(const o of cluster.origin){
      if(!candidate.origin.includes(o)){
        candidate.origin.push(o);
      }
    }
    candidate.lastSeenAt = now;
    return candidate;
  }

  save(candidate: Candidate) {
    this.candidates.set(candidate.key, candidate);
  }

  remove(key: string){
    this.candidates.delete(key);
  }

  clear(){
    this.candidates.clear();
  }
}