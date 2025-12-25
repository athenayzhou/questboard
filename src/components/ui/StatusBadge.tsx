type StatusProps = {
  status: "completed" | "failed"
} 

export function StatusBadge({
  status,
}: 
StatusProps
) {
  return(
    <span className={`status ${status}`}>
      {status === "completed" ? "✓ completed" : "✕ failed"}
    </span>
  )
}

// function StatusBadge({
//   status,
// } : { status: "available" | "accepted" | "completed" | "failed" }){
//   return(

//   )
// }