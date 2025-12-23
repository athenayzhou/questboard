import { Canvas } from "@react-three/fiber"
import { OrthographicCamera, OrbitControls, Environment } from "@react-three/drei"
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
        <Environment preset="apartment" />
        <ambientLight intensity={1} />
        {/* <directionalLight position={[5, 10, 5]} intensity={1}/> */}
        {/* <directionalLight color="white" position={[-10, 0, 20]} intensity={1} /> */}
        <directionalLight color="#ffffff" position={[55, 0, 5]} intensity={1} />


        <Name position={[-10,5,10]} />
        
        {/* ground */}
        <mesh position={[0, 0.1, 0]} rotation={[-Math.PI/2, 0, 0]} >
          <planeGeometry args={[200, 200]} />
          <meshStandardMaterial color="lightgrey" />
        </mesh>

        {/* kitchen */}
        <Model 
          src="./kitchen.glb"
          position={[0, 0, 0]}
          scale={1}
          // overlay="settings"
          // label="Settings"
        />

        {/* profile */}
        <Model 
          src="./mirror.glb"
          position={[-3, 2, 3]}
          rotation={[0, Math.PI/2, 0]}
          scale={5}
          overlay="profile"
          label="Profile"
        />

        {/* quest board */}
        <Model 
          src="./bulletin.glb"
          position={[-7, 0, 6]}
          rotation={[0, Math.PI/2, 0]}
          scale={1}
          overlay="quests"
          label="Quest Board"
        />

        {/* friends list */}
        <Model 
          src="./phone.glb"
          position={[-2.9, 2.7, -2.9]}
          rotation={[0,0.7,0]}
          scale={0.5}
          overlay="friends"
          label="Friends List"
        />

        {/* skill tree */}
        <Model 
          src="./bonsai.glb"
          position={[1, 1.85, 2.3]}
          rotation={[0,Math.PI/2,0]}
          scale={2}
          overlay="skills"
          label="Skill Tree"
        />

        {/* settings */}
        <Model 
          src="./toolbox.glb"
          position={[2.6, 4.3, -3]}
          scale={0.75}
          overlay="settings"
          label="Settings"
        />

      </Canvas>
    </div>
  )
}