import { Scene } from './components/Scene'
import { OverlayManager } from './components/OverlayManager'
import { useEffect, useState } from 'react';
import { OrbitToggle } from './components/ui/OrbitToggle';
import { useOverlay } from './utils/overlay';
import { Canvas } from '@react-three/fiber';
import { ActiveQuest } from './components/quest/ActiveQuests';

import { evidenceStore, candidateStore, clusterStore, skillStore } from './store/bundledStores';
import { TEST_SKILL } from './dev/data/TEST_SKILL';
import { onQuestComplete } from './hooks/onQuestComplete';
import { usePlayerStore } from './store/player';
import { TEST_PLAYER_DATA } from './dev/data/TEST_PROFILE';

function App() {
  const [orbitUser, setOrbitUser] = useState(true);
  const activeOverlay = useOverlay(s=> s.activeOverlay)
  const overlayOpen = activeOverlay !== null;
  const orbitEnabled = orbitUser && !overlayOpen;


  //dev
  const testPlayer = usePlayerStore(s => s.setPlayer);
  useEffect(() => {
    clusterStore.clear();
    candidateStore.clear();
    skillStore.clear();

    TEST_SKILL.forEach((quest) => {
      onQuestComplete(quest, {
        evidenceStore,
        clusterStore,
        candidateStore,
        skillStore,
      });
    })
    // console.log("evidence:",evidenceStore)
    // console.log("cluster:",clusterStore)
    // console.log("candidate:",candidateStore)
    // console.log("skill:",skillStore)

    testPlayer(structuredClone(TEST_PLAYER_DATA));
  }, [])



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
