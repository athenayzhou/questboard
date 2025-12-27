import { Scene } from './components/Scene'
import { OverlayManager } from './components/OverlayManager'
import { useState } from 'react';
import { OrbitToggle } from './components/OrbitToggle';
import { useOverlay } from './utils/overlay';
import { Canvas } from '@react-three/fiber';
import { ActiveQuest } from './components/ActiveQuests';

import { discover } from './utils/skill/generation/discover';
import { CandidateStore } from './utils/skill/store/candidate';
import { SkillStore } from './utils/skill/store/skill';
import { promote } from './utils/skill/generation/promotion';
import { EvidenceStore } from './utils/skill/store/evidence';

function App() {
  const [orbitUser, setOrbitUser] = useState(true);
  const activeOverlay = useOverlay(s=> s.activeOverlay)

  const overlayOpen = activeOverlay !== null;
  const orbitEnabled = orbitUser && !overlayOpen

  const evidenceStore = new EvidenceStore();
  const candidateStore = new CandidateStore();
  const skillStore = new SkillStore();
    discover(evidenceStore, candidateStore);
    const candidates = candidateStore.getAll().filter(c => c.state === "ready" )
    
    console.log("all evidence", evidenceStore.getAll())
    console.log("all candidates", candidateStore.getAll())

    candidates.forEach(c => {
      const name = c.suggestedNames?.[0] ?? "unnamed skill";
      const skill = promote(c, name, skillStore)
      console.log("promoted:", skill)
    })
    console.log("all named skills", skillStore.getAll())
    // },[])

  return (
    <div id="root">
      <Canvas resize={{ scroll: false }} >
        <Scene orbitEnabled={orbitEnabled} resetCamera={!orbitUser} />
      </Canvas>
      <OrbitToggle enabled={orbitUser} toggle={()=> setOrbitUser(v=> !v)} />
      <div id="html-layer" />
      <ActiveQuest />
      <OverlayManager />
      <div id="windows" />
    </div>
  )
}

export default App
