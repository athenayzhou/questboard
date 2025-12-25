import { Scene } from './components/Scene'
import { OverlayManager } from './components/OverlayManager'
import { useState } from 'react';
import { OrbitToggle } from './components/OrbitToggle';
import { useOverlay } from './types/overlay';
import { Canvas } from '@react-three/fiber';

function App() {
  const [orbitUser, setOrbitUser] = useState(true);
  const activeOverlay = useOverlay(s=> s.activeOverlay)

  const overlayOpen = activeOverlay !== null;
  const orbitEnabled = orbitUser && !overlayOpen

  return (
    <div id="root">
      <Canvas resize={{ scroll: false }} >
        <Scene orbitEnabled={orbitEnabled} resetCamera={!orbitUser} />
      </Canvas>
      <OrbitToggle enabled={orbitUser} toggle={()=> setOrbitUser(v=> !v)} />
      <div id="html-layer" />
      <OverlayManager />
      <div id="windows" />
    </div>
  )
}

export default App
