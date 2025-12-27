import type { Cluster, Candidate } from "../../../types/skills";

export class CandidateStore {
  private map = new Map<string, Candidate>();

  getCandidate(hash: string): Candidate | undefined {
    return this.map.get(hash);
  }

  createCandidate(cluster: Cluster, now: number): Candidate {
    const candidate: Candidate = {
      id: `candidate-${cluster.hash}`,
      verbs: cluster.verbs,
      objects: cluster.objects,
      contexts: cluster.contexts,
      evidenceCount: cluster.evidenceIds.length,
      confidence: 0,
      state: "latent",
      firstSeenAt: now,
      lastSeenAt: now,
    };
    this.map.set(cluster.hash, candidate);
    return candidate;
  }

  saveCandidate(candidate: Candidate) {
    this.map.set(candidate.id.replace("candidate-", ""), candidate);
  }

  getAll() {
    return [...this.map.values()];
  }
}