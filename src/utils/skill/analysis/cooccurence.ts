type CoOccurence = {
  a: string,
  b: string,
  weight: number,
  lastSeen: number,
}

const coOccurene = new Map<string, CoOccurence>()

function key(a: string, b: string){
  return [a,b].sort().join("::");
}

export function reinforce(
  words: string[],
  now = Date.now(),
) {
  for (let i=0; i < words.length; i++) {
    for (let j=0; j < words.length; j++) {

      const k = key(words[i], words[j]);
      const existing = coOccurene.get(k);

      if(existing) {
        existing.weight += 1;
        existing.lastSeen = now;
      } else {
        coOccurene.set(k, {
          a: words[i],
          b: words[j],
          weight: 1,
          lastSeen: now,
        })
      }
    }
  }
}

export function getCoEdges() {
  return [...coOccurene.values()]
}