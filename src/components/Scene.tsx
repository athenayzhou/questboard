import { Canvas } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import { useOverlay } from "../types/overlay"

import Name from "./Name"

export function Scene() {
  const openOverlay = useOverlay((s) => s.openOverlay);

  return (
    <>
      <Canvas style={{ width: "100%", height: "100%"}} resize={{ scroll: false }} camera={{ position: [0, 5, 10], fov: 50 }}>
        <OrbitControls />
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 10, 5]} intensity={1}/>

        <Name position={[-10,0,0]} />
        
        {/* ground */}
        <mesh position={[0, 0, -1]} rotation={[-Math.PI/2, 0, 0]} >
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="lightgrey" />
        </mesh>

        {/* profile */}
        <mesh position={[-4, 1, 0]} onClick={() => openOverlay("profile")}>
          <boxGeometry args={[1, 1, 0.1]} />
          <meshStandardMaterial color="white" />
        </mesh>

        {/* quest board */}
        <mesh position={[-2, 1, 0]} onClick={() => openOverlay("quests")}>
          <boxGeometry args={[2, 2, 0.1]} />
          <meshStandardMaterial color="saddlebrown" />
        </mesh>

        {/* friends list */}
        <mesh position={[1, 1, 0]} onClick={() => openOverlay("friends")}>
          <boxGeometry args={[1,1,0.5]} />
          <meshStandardMaterial color="gray" />
        </mesh>

        {/* skill tree */}
        <mesh position={[3, 2, 0]} onClick={() => openOverlay("skills")}>
          <boxGeometry args={[1,1,0.5]} />
          <meshStandardMaterial color="green" />
        </mesh>

        {/* settings */}
        <mesh position={[5, 1, 0]} onClick={() => openOverlay("settings")}>
          <boxGeometry args={[1,1,0.5]} />
          <meshStandardMaterial color="darkgrey" />
        </mesh>

      </Canvas>
    </>
  )
}