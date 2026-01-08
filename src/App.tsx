import { Scene } from './components/Scene'
import { OverlayManager } from './components/OverlayManager'
import { useEffect, useState } from 'react';
import { OrbitToggle } from './components/ui/OrbitToggle';
import { useOverlay } from './utils/overlay';
import { Canvas } from '@react-three/fiber';
import { ActiveQuest } from './components/quest/ActiveQuests';

import { evidenceStore, candidateStore, clusterStore, skillStore } from './utils/skill/store/stores';
import { TEST_DATA } from './dev/data/TEST_SKILL';
import { onQuestComplete } from './hooks/onQuestComplete';
import { generateNames } from './utils/skill/generation/name';
import { promote } from './utils/skill/generation/promote';

function App() {
  const [orbitUser, setOrbitUser] = useState(true);
  const activeOverlay = useOverlay(s=> s.activeOverlay)

  const overlayOpen = activeOverlay !== null;
  const orbitEnabled = orbitUser && !overlayOpen;

  useEffect(() => {

  //for testing
    TEST_DATA.forEach((quest) => {
      clusterStore.clear();
      candidateStore.clear();
      skillStore.clear();

      onQuestComplete(quest, {
      evidenceStore,
      clusterStore,
      candidateStore,
      skillStore,
      });
    })
  //

    // const ready = candidateStore.getAll().filter(c => c.state === "ready");
    // name(ready, candidateStore, skillStore);

  }, [])

  // console.log("evidence:",evidenceStore)
  // console.log("cluster:",clusterStore)
  console.log("candidate:",candidateStore)
  console.log("skill:",skillStore)

  
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
