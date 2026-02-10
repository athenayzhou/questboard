import type { Candidate } from "../../../types/skills";
import type { CandidateStore } from "../../../store/candidate";
import type { SkillStore } from "../../../store/skill";
import { DEFAULT, NAME } from "../../constants";
import { promote } from "./promote";

export function generateNames(candidate: Candidate): string[] {
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
function canonicalObject(objects: string[]){
  return objects[0] ?? DEFAULT.OBJECT_NAME;
}
function random<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function unique(arr: string[]) {
  return [...new Set(arr)];
}



export function name(candidates: Candidate[], candidateStore: CandidateStore, skillStore: SkillStore){
  for (const candidate of candidates){
    const suggestions = generateNames(candidate);
    suggestName(candidate, suggestions);

    promote(candidate, suggestions[0], candidateStore, skillStore)
  }
}
function suggestName(candidate: Candidate, suggestions: string[]){
  // console.log(`Prompt naming for candidate: ${candidate.key}`);
  // console.log("Suggested names:", suggestions);
}