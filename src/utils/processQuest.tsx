import type { Quest } from "../types/quest";

import { EvidenceStore } from "./skill/store/evidence";
import { CandidateStore } from "./skill/store/candidate";
import { SkillStore } from "./skill/store/skill";

import { tokenize } from "./text";
import { extractVerbs, extractObjects } from "./verb";
import { discover } from "./skill/generation/discover";
import { promote } from "./skill/generation/promote";
import { suggestNames } from "./skill/generation/name";

export function processQuest(
  quest: Quest,
  {
    evidenceStore,
    candidateStore,
    skillStore,
    now = Date.now(),
    autoPromote = false,
  } : {
    evidenceStore: EvidenceStore;
    candidateStore: CandidateStore;
    skillStore: SkillStore;
    now?: number;
    autoPromote?: boolean;
  }
){
  const tokens = tokenize(quest.title);
  const verbs = extractVerbs(tokens);
  const objects = extractObjects(tokens, verbs);
  verbs.forEach(v =>
    objects.forEach(o =>
      evidenceStore.updateEvidence(v, o, quest.duration)
    )
  );

  discover(evidenceStore, candidateStore, now);

  const candidates = candidateStore.getAll();
  candidates.forEach(c => {
    if (c.state !== "ready") return;

    if (!c.suggestedNames || c.suggestedNames.length === 0) {
      c.suggestedNames = suggestNames(c);
      candidateStore.saveCandidate(c);
    }
  
    if(autoPromote) {
      promote(c, c.suggestedNames[0], skillStore);
    }
  })
}
