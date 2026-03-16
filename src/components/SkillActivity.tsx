import { Html } from "@react-three/drei";
import { ProgressBar } from "./ui/ProgressBar";
import { levelToProgress } from "../utils/skill/analysis/experience";
import { useRecentSkills } from "../hooks/useRecentSkills";

type SkillActivityProps = {
  position?: [number, number, number]
}

export function SkillActivity({
  position = [0, 1.5, 0],
}: SkillActivityProps){
  const skills = useRecentSkills() ?? [];

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
    <div className="skill-activity-wrapper">
      <div className="skill-activity-container">
        {skills.length === 0 ? (
          <p className="skill-activity-empty">no recent skill activity</p>
        ) : (
          skills.map(skill => {
            const { progress } = levelToProgress(skill.xp);
            return (
              <div key={skill.id} className="skill-progress-bar">
                <div className="bar-text">
                  <span className="skill-name">{skill.name}</span>
                </div>
                <ProgressBar level={skill.level} progress={progress} />
              </div>
            );
          })
        )}
      </div>
    </div>
    </Html>
  )
}