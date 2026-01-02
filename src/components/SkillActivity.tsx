import { useRecentSkills } from "../hooks/useRecentSkills";
import { ProgressBar } from "./ui/ProgressBar";
import { Html } from "@react-three/drei";
import { useState, useEffect } from "react";

type SkillActivityProps = {
  position?: [number, number, number]
}

export function SkillActivity({
  position = [0, 1.5, 0],
}: SkillActivityProps){
  const skills = useRecentSkills(3);
  // if (skills.length === 0) return null;

  // const htmlPortal = document.getElementById("html-layer");
  // if(!htmlPortal) return null;
  const [portal, setPortal] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setPortal(document.getElementById("html-layer"));
  }, []);

  if (!portal || skills.length === 0) return null;
  console.log("portal:", portal);

  return(
    <Html 
    position={position}
    transform
    className="name" 
    wrapperClass="name-wrapper"
    portal={{ current: portal }}
    center
    >
    <div className="skill-activity">
      <h3>skills</h3>
      <div className="skill-list">
        {skills.map((skill) => (
          <div key={skill.id} className="skill-progress-bar">
            <div className="bar-text">
              <span className="skill-name">{skill.name}</span>
            </div>
            <pre style={{ color: "white" }}>
  {JSON.stringify(skill, null, 2)}
</pre>
            <ProgressBar xp={skill.progress} />
          </div>
        ))}
      </div>
    </div>
    </Html>
  )
}