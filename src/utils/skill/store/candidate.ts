import type { Cluster, Candidate } from "../../../types/skills";

export class CandidateStore {
  private candidates = new Map<string, Candidate>();

  getAll() {
    return [...this.candidates.values()];
  }

  get(key: string): Candidate | undefined {
    return this.candidates.get(key);
  }

  create(
    cluster: Cluster,
    now: number,
  ): Candidate {
    const key = `${cluster.verb}:${cluster.object}`;
    let candidate = this.candidates.get(key);

    const clusterCopy = {
      key: cluster.key,
      verb: cluster.verb,
      object: cluster.object,
      count: cluster.count,
      confidence: cluster.confidence,
      origin: cluster.origin ? [...cluster.origin] : [],
    }

    if(!candidate){
      candidate = {
        id: crypto.randomUUID(),
        key,
        verb: cluster.verb,
        objects: [cluster.object],
        clusters: [clusterCopy],
        confidence: cluster.confidence,
        origin: [...(cluster.origin ?? [])],
        firstSeenAt: now,
        lastSeenAt: now,
        state: "latent",
        suggestedNames:[],
      }
      this.candidates.set(key, candidate);
    } else {
      if(!candidate.objects.includes(cluster.object)){
        candidate.objects.push(cluster.object);
      }
      if(!candidate.clusters.some(c => c.key === cluster.key)) {
        candidate.clusters.push({...cluster});
      }
      candidate.confidence = Math.max(candidate.confidence, cluster.confidence);
      for(const o of cluster.origin ?? []){
        if(!candidate.origin.includes(o)){
          candidate.origin.push(o);
        }
      }
      candidate.lastSeenAt = now;
    }
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