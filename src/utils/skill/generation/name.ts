import type { Candidate } from "../../../types/skills";
import type { CandidateStore } from "../../../store/candidate";
import { useSkillStore } from "../../../store/skill";
import { DEFAULT, NAME } from "../../constants";
import { promote } from "./promote";

function canonicalObject(objects: string[]){
  return objects[0] ?? DEFAULT.OBJECT_NAME;
}
function random<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function unique(arr: string[]) {
  return [...new Set(arr)];
}
export function generateSkillNames(candidate: Candidate): string[] {
  const verb = candidate.verb
  const object = canonicalObject(candidate.objects);
  const base = NAME.TEMPLATES.map(t => 
    t
      .replace("{verb}", verb)
      .replace("{object}", object)
      .replace("{adjective}", random(NAME.ADJECTIVES))
  );
  return unique(base).slice(0,3);
}

export function autoNameSkill(
  candidates: Candidate[],
  candidateStore: CandidateStore
): string[] {
  const getByKey = useSkillStore.getState().getByKey;
  const createdKeys: string[] = [];
  for (const candidate of candidates) {
    const existed = !!getByKey(candidate.key);
    const suggestions = generateSkillNames(candidate);
    promote(candidate, suggestions[0], candidateStore);
    if (!existed) createdKeys.push(candidate.key);
  }
  return createdKeys;
}

export function generateMasteryName(verb: string): string {
  const v = verb.charAt(0).toLowerCase() + verb.slice(1);
  return  `${v} mastery`;
}

export function generateMasteryTitle(verb: string): string {
  const v = verb.charAt(0).toLowerCase() + verb.slice(1);
  return  `master of ${v}`;
}