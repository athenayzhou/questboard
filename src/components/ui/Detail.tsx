
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
      <span className="detail-label">{label}</span>
      <span className="detail-value">{value}</span>
    </div>
  )
}