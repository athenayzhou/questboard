type ProgressBarProps = {
  level: number;
  progress: number
};

export function ProgressBar({ level, progress }: ProgressBarProps) {
  return (
    <div className="progress-wrapper">
      <div className="progress-label">lv {level}</div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress * 100}%` }} />
      </div>
    </div>
  )
}