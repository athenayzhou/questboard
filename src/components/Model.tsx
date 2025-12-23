import { useGLTF, Html } from "@react-three/drei"
import { useOverlay } from "../types/overlay"
import { useMemo } from "react";

type ModelProps = {
  src: string
  position?: [number, number, number]
  scale?: number
  rotation?: [number, number, number]
  overlay?: "profile"| "quests" | "friends" | "skills" | "settings" | null
  label?: string
}

export function Model({
  src,
  position = [0,0,0],
  scale = 1,
  rotation = [0,0,0],
  overlay= null,
  label,
} : ModelProps) {
  const { scene } = useGLTF(src);
  const openOverlay = useOverlay((s) => s.openOverlay);

  const htmlPortal = useMemo(
    () => document.getElementById("html-layer"),
    []
  )

  return(
    <group
      position={position}
      rotation={rotation}
      onClick={()=>overlay && openOverlay(overlay)}
    >
      <primitive scale={scale} object={scene} />
      {label && htmlPortal && (
        <Html 
          position={[0, 1.5, 0]} 
          portal={{ current: htmlPortal }}
          transform
          center
          distanceFactor={5}
          wrapperClass="label-wrapper"
          >
          <div className="label">
            <span>{label}</span>
          </div>
        </Html>
      )}
    </group>
  )
}

useGLTF.preload("./mirror.glb");
useGLTF.preload("./bulletin.glb");
useGLTF.preload("./phone.glb");
useGLTF.preload("./tree.glb");
useGLTF.preload("./toolbox.glb");