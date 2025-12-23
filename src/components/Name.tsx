import { Html } from "@react-three/drei";

type NameProps = {
  position?: [number, number, number]
}

export default function Name({
  position = [0, 1.5, 0],
} : NameProps){

  const htmlPortal = document.getElementById("html-layer");
  if(!htmlPortal) return null;

  return(
    <Html 
    position={position}
    transform
    className="name" 
    wrapperClass="name-wrapper"
    portal={{ current: htmlPortal }}
    center
    >
      <div className="name-container">
        <div className="name-text">donna</div>
        <div className="name-title">amateur stewer</div>
      </div>
    </Html>
  )
}