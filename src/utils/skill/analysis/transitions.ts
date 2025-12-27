type Transition = {
  from: string;
  to: string;
  weight: number;
  lastSeen: number;
}

const transitions = new Map<string, Transition>()

function key(from: string, to: string){
  return `${from}->${to}`
}

export function record(
  from: string, 
  to: string,
  now = Date.now()
) {
  if(from === to) return;

  const k = key(from, to);
  const existing = transitions.get(k)

  if(existing) {
    existing.weight += 1;
    existing.lastSeen = now;
  } else {
    transitions.set(k, {
      from,
      to,
      weight: 1,
      lastSeen: now,
    });
  }
}

export function getTransitions(minCount = 3) {
  return [...transitions.values()].filter(t => t.weight >= minCount)
}

export function getTransitionEdges(){
  return Array.from(transitions.values()).map(t => ({
    from: t.from,
    to: t.to,
    strength: t.weight,
  }))
}