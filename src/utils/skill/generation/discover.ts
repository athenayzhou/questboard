import type { Candidate, EvidenceCluster, Cluster } from "../../../types/skills";

import { EvidenceStore } from "../store/evidence";
import { CandidateStore } from "../store/candidate";

import { clusterEvidence } from "../analysis/clustering";
import { hashCluster } from "../analysis/clustering";
import { evaluateReadiness } from "../analysis/confidence";
import { suggestNames } from "./name";

const now = Date.now();

function logCandidates(candidates: Candidate[]) {
  for (const candidate of candidates) {
    console.log({
      id: candidate.id,
      verbs: candidate.verbs,
      objects: candidate.objects,
      confidence: candidate.confidence,
      state: candidate.state,
      evidenceCount: candidate.evidenceCount,
      suggestedNames: candidate.suggestedNames,
    })
  }
}

export function discover(evidenceStore: EvidenceStore, candidateStore: CandidateStore) {
  for (let i = 0; i < 8; i++){
    evidenceStore.updateEvidence("edit", "ui", 4020);
  }

  const evidence = evidenceStore.getAll();
  const clusterEC: EvidenceCluster[] = clusterEvidence(evidence);

  clusterEC.forEach(ec => {
    const cluster: Cluster = { ...ec, hash: hashCluster(ec) };
    let candidate = candidateStore.getCandidate(cluster.hash);
    if(!candidate) {
      candidate = candidateStore.createCandidate(cluster, now);
    }

    candidate.evidenceCount += cluster.evidenceIds.length;
    candidate.confidence = 1 - Math.exp(-0.12 * candidate.evidenceCount);
    candidate.lastSeenAt = now;
    candidate.state = evaluateReadiness(candidate);

    if (candidate.state === "ready" && (!candidate.dismissedUntil || candidate.dismissedUntil < now)){
      candidate.suggestedNames = suggestNames(candidate);
      candidate.dismissedUntil = now + 7 * 24 * 60 * 60 * 1000;
    }
    candidateStore.saveCandidate(candidate);
  });

  // logCandidates(candidateStore.getAll())
}