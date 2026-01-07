import { useRecentSkills } from "../hooks/useRecentSkills";
import { ProgressBar } from "./ui/ProgressBar";
import { Html } from "@react-three/drei";
import { useEffect } from "react";

type SkillActivityProps = {
  position?: [number, number, number]
}

export function SkillActivity({
  position = [0, 1.5, 0],
}: SkillActivityProps){
  const skills = useRecentSkills() ?? [];

  const htmlPortal = document.getElementById("html-layer");
  if(!htmlPortal) return null;

  useEffect(() => {
  console.log("skill activity", skills);
  }, [skills]);



  return(
    <Html 
    position={position}
    transform
    className="name" 
    wrapperClass="name-wrapper"
    portal={{ current: htmlPortal }}
    center
    >
    <div className="skill-activity-wrapper">
      <div className="skill-activity-container">
        {skills.map((skill) => (
          <div key={skill.id} className="skill-progress-bar">
            <div className="bar-text">
              <span className="skill-name">{skill.name}</span>
            </div>
            <ProgressBar xp={skill.progress} />
          </div>
        ))}
      </div>
    </div>
    </Html>
  )
}