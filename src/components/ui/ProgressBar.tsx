import { levelToProgress } from "../../utils/skill/analysis/experience";

type ProgressBarProps = {
  xp: number;
};

export function ProgressBar({ xp }: ProgressBarProps) {
  const { level, progress } = levelToProgress(xp);
  return (
    <div className="progress-wrapper">
      <div className="progress-label">lv {level}</div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress * 100}%` }} />
      </div>
    </div>
  )
}