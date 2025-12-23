import { Canvas } from "@react-three/fiber"
import { OrthographicCamera, OrbitControls } from "@react-three/drei"
import { Model } from "./Model";

import Name from "./Name"

export function Scene() {

  return (
    <div id="root">
      <Canvas resize={{ scroll: false }} >
        <OrthographicCamera makeDefault
          zoom={50}
          position={[10, 10, 10]}
          rotation={[-Math.atan(1/Math.sqrt(2)),Math.PI/4,0]}
          onUpdate={(cam)=>cam.updateProjectionMatrix()}
        />
        <OrbitControls 
          // enableRotate={false}
          // enableZoom={false} 
          enablePan
          panSpeed={0.5}
        />
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 10, 5]} intensity={1}/>

        <Name position={[-15,0,1]} />
        
        {/* ground */}
        <mesh position={[0, 0, -1]} rotation={[-Math.PI/2, 0, 0]} >
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="lightgrey" />
        </mesh>

        {/* profile */}
        <Model 
          src="./mirror.glb"
          position={[-2, 0, 0]}
          scale={5}
          overlay="profile"
          label="Profile"
        />

        {/* quest board */}
        <Model 
          src="./bulletin.glb"
          position={[-8, 0, 2]}
          rotation={[0, Math.PI/2, 0]}
          scale={1}
          overlay="quests"
          label="Quest Board"
        />

        {/* friends list */}
        <Model 
          src="./phone.glb"
          position={[1, 0, 0]}
          scale={0.5}
          overlay="friends"
          label="Friends List"
        />

        {/* skill tree */}
        <Model 
          src="./bonsai.glb"
          position={[3, 0, 0]}
          scale={2}
          overlay="skills"
          label="Skill Tree"
        />

        {/* settings */}
        <Model 
          src="./toolbox.glb"
          position={[5, 0, 0]}
          scale={0.75}
          overlay="settings"
          label="Settings"
        />

      </Canvas>
    </div>
  )
}