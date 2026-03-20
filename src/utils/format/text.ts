import { VERB, DEFAULT } from "../constants";

const TIMEWORDS = new Set([
  "minute", "minutes", "min", "mins",
  "hour", "hours", "hr", "hrs",
  "day", "days",
  "week", "week",
  "month", "months"
]);
const MEASUREWORDS = new Set([
  "times", "x", "once", "twice", "percent", "%", "kg", "lb",
]);
const STOPWORDS = new Set([
  "and", "the", "a", "an", "to", "of", "for", "with", "on", "in", "at",
]);
const IGNORE_LEMMATIZE = new Set(["morning", "afternoon", "evening"]);

/** Baseline verbs shipped with the app; user-learned verbs persist per account (extension blob). */
const VERB_BASELINE = new Set([
  "clean", "cook", "write", "organize", "wash", "plan", "build", "review",
]);

export const KNOWN_VERBS: Set<string> = new Set(VERB_BASELINE);

/** Replace runtime verb set from bootstrap / server snapshot (keeps baseline + stored). */
export function hydrateLearnedVerbsFromExtension(stored: string[] | undefined) {
  KNOWN_VERBS.clear();
  for (const v of VERB_BASELINE) KNOWN_VERBS.add(v);
  if (!stored?.length) return;
  for (const v of stored) {
    if (typeof v === "string" && v.trim().length >= 3) {
      KNOWN_VERBS.add(v.trim().toLowerCase());
    }
  }
}

export function getLearnedVerbsForExtension(): string[] {
  return [...KNOWN_VERBS].filter((v) => !VERB_BASELINE.has(v));
}

function persistLearnedVerbs() {
  void import("@/lib/apiExtension").then((m) => m.scheduleExtensionSync());
}

const ADJECTIVE_SUFFIXES = [
  "ful",
  "less",
  "ous",
  "ive",
  "able",
  "ible",
  "al",
  "ic",
  "ish",
  "ary",
  "ory",
] as const;

function looksLikeAdjective(token: string) {
  if (!token) return false;
  // common adjective suffixes; heuristic only
  return ADJECTIVE_SUFFIXES.some((s) => token.endsWith(s));
}

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/-/g, " ")
    .replace(/[^\w\s]/g, "")
    .replace(/\b(the|a|an|to|and|of)\b/g, "")
    .trim();
}
export function lemmatize(word: string): string {
  if(IGNORE_LEMMATIZE.has(word)) return word;
  return word.replace(/(ing|ed|ly|s)$/g, "");
}
export function tokenize(text: string): string[] {
  return normalize(text)
    .split(/\W+/)
    .map(w=> lemmatize(w))
    .filter(word => word && word.length >= 3 && !STOPWORDS.has(word));
}
export function filter(tokens:string[]) {
  return tokens.filter(token => {
    if ((/^\d+(\.\d+)?$/).test(token)) return false;
    if (TIMEWORDS.has(token)) return false;
    if (MEASUREWORDS.has(token)) return false;
    return true;
  })
}


const verbFrequency: Map<string, number> = new Map();

export function trackVerb(verb: string) {
  if (!verb) return;
  const count = (verbFrequency.get(verb) || 0) +1;
  verbFrequency.set(verb, count)
  if (!KNOWN_VERBS.has(verb) && count > VERB.THRESHOLD) {
    KNOWN_VERBS.add(verb);
    persistLearnedVerbs();
    // console.log(`new verb: ${verb}`);
  }
}

export function extractVerb(tokens: string[]): string {
  for (const t of tokens){
    if (t.length < 3 || TIMEWORDS.has(t) || MEASUREWORDS.has(t)) continue;
    trackVerb(t);
    if (KNOWN_VERBS.has(t)) return t;
  }
  return "";
}
export function extractVerbs(
  tokens: string[],
  options: { allowMultiple?: boolean } = {}
): string[] {
  const primary = extractVerb(tokens);
  if (!primary) return [];
  if (!options.allowMultiple) return [primary];
  const verbs = new Set<string>([primary]);
  for (const t of tokens.slice(1)) {
    const v = lemmatize(t);
    trackVerb(v);
    if (KNOWN_VERBS.has(v)) verbs.add(v);
  }
  return [...verbs];
}

export function extractObjects(
  tokens: string[],
): string[] {
  const objects: string[] = [];
  for (const token of tokens) {
    if (STOPWORDS.has(token)) continue;
    if (KNOWN_VERBS.has(token)) continue;
    objects.push(token);
  }
  return objects;
}

export type VOPair = {
  verb: string;
  object: string;
};
export function extractPair(questTitle: string): VOPair[] {
  const tokens = filter(tokenize(questTitle));
  if (tokens.length === 0) return [];

  let verbs = extractVerbs(tokens, { allowMultiple: true });
  let objects = extractObjects(tokens);

  // Fallback: if we don't recognize a verb, treat the first token as the verb.
  // This keeps skill extraction working even for novel verbs.
  if (!verbs.length) {
    const [first, ...rest] = tokens;
    // If the first token looks like an adjective (e.g. "awful"), prefer a neutral verb.
    // This yields nicer naming suggestions like "practice {object}".
    if (first && looksLikeAdjective(first)) {
      verbs = ["practice"];
      objects = rest.length ? rest : [first];
    } else {
      verbs = first ? [first] : [];
      objects = rest;
    }
  }

  // Single token: treat as verb with default object so we can still match existing skills and award XP
  if (tokens.length === 1) {
    verbs = [tokens[0]];
    objects = [DEFAULT.OBJECT_NAME];
  }

  if (!objects.length) {
    objects = [DEFAULT.OBJECT_NAME];
  }

  return verbs.flatMap(verb =>
    objects.map(object => ({ verb, object }))
  );
}



// let lastVerb: string | null = null;
// export function getLastVerb(): string | null {
//   return lastVerb;
// }
// export function setLastVerb(v: string) {
//   lastVerb = v;
// }


// type VerbProps = {
//   verb: string;
//   count: number;
//   questIds: Set<string>;
//   activeDays: Set<string>;
// }

// const verbs = new Map<string, VerbProps>()

// export function countVerbs(
//   verb: string,
//   questId: string,
//   timestamp: number
// ) {
//   const day = new Date(timestamp).toISOString().slice(0, 10);

//   if(!verbs.has(verb)) {
//     verbs.set(verb, {
//       verb,
//       count: 0,
//       questIds: new Set(),
//       activeDays: new Set(),
//     })
//   }

//   const entry = verbs.get(verb)!
//   entry.count++
//   entry.questIds.add(questId);
//   entry.activeDays.add(day);
// }

// export function getVerbs(){
//   return [...verbs.values()].filter(v =>
//     v.count >= 3 &&
//     v.questIds.size >= 3 &&
//     v.activeDays.size >= 2
//   )
// }