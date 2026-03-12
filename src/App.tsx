import { Scene } from './components/Scene';
import { OverlayManager } from './components/overlay/OverlayManager';
import { useState } from 'react';
import { OrbitToggle } from './components/ui/OrbitToggle';
import { useOverlay } from './store/overlay';
import { Canvas } from '@react-three/fiber';
import { ActiveQuest } from './components/secondary/ActiveQuests';

import { useSkillDecay } from './hooks/useSkillDecay';
import { NamePrompt } from './hooks/onQuestComplete';

import { ToastProvider } from './store/ToastProvider';
import { ConfirmProvider } from './store/ConfirmProvider';
import { ToastContainer } from './components/ui/Toast';

function App() {
  const [orbitUser, setOrbitUser] = useState(true);
  const activeOverlay = useOverlay(s => s.activeOverlay);
  const overlayOpen = activeOverlay !== null;
  const orbitEnabled = orbitUser && !overlayOpen;

  useSkillDecay();

  return (
    <ConfirmProvider>
    <ToastProvider>
    <ToastContainer />
    <div id="root">
      <Canvas resize={{ scroll: false }} >
        <Scene orbitEnabled={orbitEnabled} resetCamera={!orbitUser} />
      </Canvas>
      <OrbitToggle enabled={orbitUser} toggle={()=> setOrbitUser(v=> !v)} />
      <div id="html-layer" />
      <ActiveQuest />
      <OverlayManager />
      <div id="windows" />
      <NamePrompt />
    </div>
    </ToastProvider>
    </ConfirmProvider>
  )
}

export default App;
