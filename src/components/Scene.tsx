import { useThree } from "@react-three/fiber"
import { OrthographicCamera, OrbitControls, Environment } from "@react-three/drei"
import { Model } from "./Model";
import { useRef, useEffect } from "react";

import Name from "./Name"

export function Scene({ 
  orbitEnabled,
  resetCamera,
 } : { 
  orbitEnabled: boolean
  resetCamera: boolean 
}) {
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();

  useEffect(() => {
    if(!controlsRef.current) return;
    if(!resetCamera) return;

    if(!orbitEnabled){
      camera.position.set(6, 6, 6);
      controlsRef.current.target.set(0,0,0);
      controlsRef.current.update();
      // controlsRef.current.saveState();
    }
  }, [resetCamera, camera]);

  useEffect(() => {
    if(!controlsRef.current) return;
    controlsRef.current.enabled = orbitEnabled
  }, [orbitEnabled]);

  return (
    <>
        <OrthographicCamera 
          makeDefault
          zoom={50}
          position={[10, 10, 10]}
          rotation={[-Math.atan(1/Math.sqrt(2)),Math.PI/4,0]}
          onUpdate={(cam)=>cam.updateProjectionMatrix()}
        />
        <OrbitControls 
          panSpeed={0.5}
          ref={controlsRef}
        />
        <Environment preset="apartment" />
        <ambientLight intensity={1} />
        <directionalLight color="#ffffff" position={[55, 0, 5]} intensity={1} />

        <Name position={[-5,4,5]} />
        
        {/* ground */}
        <mesh position={[0, 0.1, 0]} rotation={[-Math.PI/2, 0, 0]} >
          <planeGeometry args={[200, 200]} />
          <meshStandardMaterial color="lightgrey" />
        </mesh>

        {/* kitchen */}
        <Model 
          src="./kitchen.glb"
          position={[2.5, 0, 2.5]}
          scale={1}
          // overlay="settings"
          // label="Settings"
        />

        {/* profile */}
        <Model 
          src="./mirror.glb"
          position={[-1.25, 4, 5.5]}
          rotation={[0, Math.PI/2, 0]}
          scale={[1,0.7,1]}
          overlay="profile"
          label="Profile"
        />

        {/* quest board */}
        <Model 
          src="./bulletin.glb"
          position={[-4.5, 0, 8.5]}
          rotation={[0, Math.PI/2, 0]}
          scale={1}
          overlay="quests"
          label="Quest Board"
        />

        {/* quest log */}
        <Model 
          src="./notebook.glb"
          position={[3.5, 1.9, 3.5]}
          rotation={[0,Math.PI/2,0]}
          scale={[0.05, 0.05, 0.04]}
          overlay="log"
          label="Quest Log"
        />

        {/* friends list */}
        <Model 
          src="./phone.glb"
          position={[-0.4, 2.7, -0.4]}
          rotation={[0,0.7,0]}
          scale={0.5}
          overlay="friends"
          label="Friends List"
        />

        {/* skill tree */}
        <Model 
          src="./bonsai.glb"
          position={[3.5, 1.85, 5.8]}
          rotation={[0,Math.PI/2,0]}
          scale={2}
          overlay="skills"
          label="Skill Tree"
        />

        {/* settings */}
        <Model 
          src="./toolbox.glb"
          position={[5.1, 4.3, -0.5]}
          scale={0.75}
          overlay="settings"
          label="Settings"
        />
    </>
  )
}