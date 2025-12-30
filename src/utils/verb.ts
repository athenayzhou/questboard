type VerbProps = {
  verb: string;
  count: number;
  questIds: Set<string>;
  activeDays: Set<string>;
}

const verbs = new Map<string, VerbProps>()

export function countVerbs(
  verb: string,
  questId: string,
  timestamp: number
) {
  const day = new Date(timestamp).toISOString().slice(0, 10);

  if(!verbs.has(verb)) {
    verbs.set(verb, {
      verb,
      count: 0,
      questIds: new Set(),
      activeDays: new Set(),
    })
  }

  const entry = verbs.get(verb)!
  entry.count++
  entry.questIds.add(questId);
  entry.activeDays.add(day);
}

export function getVerbs(){
  return [...verbs.values()].filter(v =>
    v.count >= 3 &&
    v.questIds.size >= 3 &&
    v.activeDays.size >= 2
  )
}

// export function extractVerbs(tokens: string[]): string[] {
//   // return tokens[0];
//   return tokens.filter(w => 
//   ["clean", "cook", "write", "organize", "wash", "plan", "build", "review"]
//     .some(v => w.startsWith(v))
//   )
// }
// export function extractObjects(tokens: string[], verbs: string[]): string[] {
//   return tokens.filter(t=> !verbs.includes(t));
// }
