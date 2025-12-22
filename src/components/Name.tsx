import { Html } from "@react-three/drei";

type NameProps = {
  position?: [number, number, number]
}

export default function Name({
  position,
} : NameProps){

  return(
    <Html className="name" position={position}>
      <div>donna</div>
      <div>amateur stewer</div>
    </Html>
  )
}