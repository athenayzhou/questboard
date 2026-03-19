import { Scene } from './components/Scene';
import { OverlayManager } from './components/overlay/OverlayManager';
import { useState } from 'react';
import { OrbitToggle } from './components/ui/OrbitToggle';
import { useOverlay } from './store/overlay';
import { Canvas } from '@react-three/fiber';
import { ActiveQuest } from './components/secondary/ActiveQuests';

import { useEffect } from 'react';
import { useSkillDecay } from './hooks/useSkillDecay';
import { NamePrompt } from './hooks/onQuestComplete';
import { useShopStore } from './store/shop';
import { DEFAULT_SHOP_ITEMS } from './data/systemItems';

import { ToastProvider } from './store/toast';
import { ConfirmProvider } from './store/confirmation';
import { ToastContainer } from './components/ui/Toast';
import { useRecurringQuests } from './hooks/useRecurringQuests';
import { useSystemQuests } from './hooks/useSystemQuests';
import { SkillActivityLog } from './components/ui/SkillActivityLog';

function App() {
  const [orbitUser, setOrbitUser] = useState(true);
  const activeOverlay = useOverlay(s => s.activeOverlay);
  const overlayOpen = activeOverlay !== null;
  const orbitEnabled = orbitUser && !overlayOpen;

  useSkillDecay();
  useRecurringQuests();
  useSystemQuests();

  useEffect(() => {
    useShopStore.getState().setItems(DEFAULT_SHOP_ITEMS);
  }, []);

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
      <SkillActivityLog />
      <OverlayManager />
      <div id="windows" />
      <NamePrompt />
    </div>
    </ToastProvider>
    </ConfirmProvider>
  )
}

export default App;
