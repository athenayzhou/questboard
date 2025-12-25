
type DifficultyProps = {
  difficulty: "easy" | "medium" | "hard"
}

export function DifficultyBadge({
  difficulty,
}: 
  DifficultyProps
) {
  return(
    <span className={`difficulty ${difficulty}`}>
      {difficulty}
    </span>
  )
}