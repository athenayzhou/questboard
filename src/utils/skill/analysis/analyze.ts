import { processText } from "../../text";
import { extractVerbs, countVerbs } from "../../verb";
import { reinforce } from "./cooccurence";
import { record } from "./transitions";
import { getLastVerb, setLastVerb } from "../../verb";

export function analyze(
  questId: string,
  text: string,
  timestamp: number
) {
  const { tokens, stems } = processText(text);
  const verbs = extractVerbs(tokens);

  //skill evidence
  verbs.forEach(v => countVerbs(v, questId, timestamp));

  //transitions: inter-quest
  const prev = getLastVerb();
  if (prev && verbs.length > 0) {
    record(prev, verbs[0]);
  };
  if (verbs.length > 0){
    setLastVerb(verbs[0]);
  };
  //transitions: intra-quest
  for (let i=0; i<verbs.length-1; i++) {
    record(verbs[i], verbs[i+1]);
  };

  //co-occurence
  reinforce(stems, timestamp);
}