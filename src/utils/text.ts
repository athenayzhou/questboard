export function normalize(title: string) {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\b(the|a|an|to|and|of)\b/g, "")
    .trim()
}

const STOPWORDS = new Set([
  "do", "the", "a", "an", "and", "of", "for", "to", "with", "make", "take", "get", "set", "clean"
])

export function tokenize(title: string): string[] {
  return normalize(title)
    .split(/\W+/)
    .filter(word => word && !STOPWORDS.has(word));
}