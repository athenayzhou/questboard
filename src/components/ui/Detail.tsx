
type DetailProps = {
  label: string,
  value: string,
}

export function Detail({
  label,
  value,
} : 
  DetailProps
) {
  return (
    <div className="log-detail">
      <span className="label">{label}</span>
      <span className="value">{value}</span>
    </div>
  )
}