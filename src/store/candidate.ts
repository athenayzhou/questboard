import type { Cluster, Candidate } from "../types/skills";
import { xpToLevel } from "../utils/skill/analysis/experience";

export class CandidateStore {
  private candidates = new Map<string, Candidate>();

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

  private create(cluster: Cluster, now = Date.now()): Candidate {
    const candidate: Candidate = {
      id: crypto.randomUUID(),
      key: `${cluster.verb}:${cluster.object}`,
      verb: cluster.verb,
      objects: [cluster.object],
      clusters: [cluster],
      xp: cluster.xp,
      level: xpToLevel(cluster.xp),
      confidence: 0,
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
      candidate.level = xpToLevel(candidate.xp);
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