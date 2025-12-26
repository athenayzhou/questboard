type StatusProps = {
  status: "completed" | "failed"
} 

export function StatusBadge({
  status,
}: 
StatusProps
) {
  return(
    <span className={`quest-status ${status}`}>
      {status === "completed" ? "✓ completed" : "✕ failed"}
    </span>
  )
}