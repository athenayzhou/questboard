export function formatDate(value: string | number | null) {
  if(value == null) return "-"
    return new Date(value).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }