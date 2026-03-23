import { OrthographicCamera, OrbitControls, Environment } from "@react-three/drei"
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { Model } from "./Model";
import { useRef, useEffect } from "react";
// import { SkillActivity } from "./SkillActivity";
// import Name from "./Name"

const COLORS = {
  grass: "#5a9c4e",
  sun: "#fff5e0",
  sky: "#e8f4e8",
  ambientGround: "#b8dcb0",
} as const;


export function Scene({
  orbitEnabled,
  resetCamera,
}: {
  orbitEnabled: boolean;
  resetCamera: boolean;
}) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  useEffect(() => {
    if (!resetCamera || !controlsRef.current) return;
    const cam = controlsRef.current.object;
    controlsRef.current.target.set(0, 0, 0);
    cam.position.set(6, 6, 6);
    cam.zoom = 50;
    cam.updateProjectionMatrix();
    controlsRef.current.update();
  }, [resetCamera]);

  useEffect(() => {
    if (!controlsRef.current) return;
    controlsRef.current.enabled = orbitEnabled;
  }, [orbitEnabled]);

  return (
    <>
      <OrthographicCamera
        makeDefault
        zoom={50}
        position={[10, 10, 10]}
        rotation={[-Math.atan(1 / Math.sqrt(2)), Math.PI / 4, 0]}
        onUpdate={(cam) => cam.updateProjectionMatrix()}
      />
      <OrbitControls ref={controlsRef} panSpeed={0.5} />

      <Environment preset="park" environmentIntensity={0.35} />

      <directionalLight
        color={COLORS.sun}
        position={[12, 20, 8]}
        intensity={2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={50}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
      />
      <hemisphereLight
        color={COLORS.sky}
        groundColor={COLORS.ambientGround}
        intensity={0.65}
      />
      <ambientLight intensity={0.4} />

      {/* <Name position={[-5, 7, 5]} /> */}

      <Model
        src="/model/kitchen.glb"
        position={[2.5, 0, 2.5]}
        scale={1}
        hideMesh={["Object_129"]}
      />

      <Model
        src="/model/mirror.glb"
        position={[-1.25, 4, 5.5]}
        rotation={[0, Math.PI / 2, 0]}
        scale={[1, 0.7, 1]}
        overlay="profile"
        label="Profile"
      />

      <Model
        src="/model/bulletin.glb"
        position={[-4.5, 0, 8.5]}
        rotation={[0, Math.PI / 2, 0]}
        scale={1}
        overlay="quests"
        label="Quest Board"
      />

      <Model
        src="/model/notebook.glb"
        position={[3.5, 1.9, 3.5]}
        rotation={[0, Math.PI / 2, 0]}
        scale={[0.05, 0.05, 0.04]}
        overlay="logs"
        label="Quest Log"
      />

      <Model
        src="/model/phone.glb"
        position={[-0.4, 2.7, -0.4]}
        rotation={[0, 0.7, 0]}
        scale={0.5}
        overlay="friends"
        label="Friends List"
      />

      <Model
        src="/model/bonsai.glb"
        position={[3.5, 1.85, 5.8]}
        rotation={[0, Math.PI / 2, 0]}
        scale={2}
        overlay="skills"
        label="Skill Ledger"
      />

      <Model
        src="/model/toolbox.glb"
        position={[5.1, 4.3, -0.5]}
        scale={0.75}
        overlay="settings"
        label="Settings"
      />
    </>
  );
}
