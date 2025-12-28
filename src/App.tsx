import { Scene } from './components/Scene'
import { OverlayManager } from './components/OverlayManager'
import { useState } from 'react';
import { OrbitToggle } from './components/ui/OrbitToggle';
import { useOverlay } from './utils/overlay';
import { Canvas } from '@react-three/fiber';
import { ActiveQuest } from './components/quest/ActiveQuests';

import { TEST_COMPLETE } from './utils/TEST_COMPLETE';
import { evidenceStore, candidateStore, skillStore } from './utils/skill/store/stores';

function App() {
  const [orbitUser, setOrbitUser] = useState(true);
  const activeOverlay = useOverlay(s=> s.activeOverlay)

  const overlayOpen = activeOverlay !== null;
  const orbitEnabled = orbitUser && !overlayOpen;

  TEST_COMPLETE();
  console.log("evidence:", evidenceStore)
  console.log("candidate:", candidateStore)
  console.log("skill:", skillStore)


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
