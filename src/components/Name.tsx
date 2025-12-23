import { Html } from "@react-three/drei";

type NameProps = {
  position?: [number, number, number]
}

export default function Name({
  position = [0, 1.5, 0],
} : NameProps){

  return(
    <Html 
    position={position}
    transform
    className="name" 
    wrapperClass="name-wrapper"
    center
    >
      <div className="name-container">
        <div className="name-text">donna</div>
        <div className="name-title">amateur stewer</div>
      </div>
    </Html>
  )
}