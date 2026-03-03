import { Scene } from './components/Scene';
import { OverlayManager } from './components/overlay/OverlayManager';
import { useState } from 'react';
import { OrbitToggle } from './components/ui/OrbitToggle';
import { useOverlay } from './store/overlay';
import { Canvas } from '@react-three/fiber';
import { ActiveQuest } from './components/secondary/ActiveQuests';

function App() {
  const [orbitUser, setOrbitUser] = useState(true);
  const activeOverlay = useOverlay(s => s.activeOverlay);
  const overlayOpen = activeOverlay !== null;
  const orbitEnabled = orbitUser && !overlayOpen;

  //dev
  // const testPlayer = usePlayerStore(s => s.setPlayer);
  // useEffect(() => {
  //   clusterStore.clear();
  //   candidateStore.clear();

  //   const questState = useQuestStore.getState();
  //   if(!questState.quests.length){
  //     useQuestStore.setState({
  //       ...questState,
  //       quests: structuredClone(TEST_BOARD)
  //     });
  //   }

  //   const friendsState = useFriendsStore.getState();
  //   if(!friendsState.friends.length){
  //     useFriendsStore.setState({
  //       ...friendsState,
  //       friends: structuredClone(TEST_FRIENDS),
  //     });
  //   }

  // }, []);

  // useEffect(() => {
  //   const timeout = setTimeout(() => {

  //   // TEST_SKILL.forEach((quest) => {
  //   //   onQuestComplete(quest, {
  //   //     evidenceStore,
  //   //     clusterStore,
  //   //     candidateStore,
  //   //   });
  //   // });
  //   testPlayer(structuredClone(TEST_PLAYER_DATA));
  //   }, 0)
  //   return () => clearTimeout(timeout);
  // }, [])



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
