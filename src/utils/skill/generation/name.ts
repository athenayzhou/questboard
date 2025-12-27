import type { Candidate } from "../../../types/skills";

const NAME_TEMPLATES = [
  "{verb} {object}",
  "{verb}ing {object}",
  "{object} {verb}",
  "{adjective} {object}",
  "{verb} craft",
  "{object} tuning",
  "{object} design",
]

const ADJECTIVES = [
  "micro",
  "adaptive",
  "intentional",
  "iterative",
  "expressive",
  "systems",
]

function canonicalVerb(verbs: string[]) {
  return verbs[0];
}
function canonicalObject(objects: string[]){
  return objects[0] ?? "Practice";
}

export function suggestNames(candidate: Candidate): string[] {
  const verb = canonicalVerb(candidate.verbs);
  const object = canonicalObject(candidate.objects);

  const base = NAME_TEMPLATES.map(t => 
    t
      .replace("{verb}", verb)
      .replace("{object}", object)
      .replace("{adjective}", random(ADJECTIVES))
  );

  return unique(base).slice(0,3);
}

function random<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function unique(arr: string[]) {
  return [...new Set(arr)];
}