/*
step 1: text processing

clean up entries
lowercase, remove punctuation, remove stop words, light stemming
*/ 


const STOPWORDS = new Set([
  "do", "the", "a", "an", "and", "of", "for", "to", "with", "make", "take", "get", "set", "clean"
])

export function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\b(the|a|an|to|and|of)\b/g, "")
    .trim()
}

export function tokenize(text: string): string[] {
  return normalize(text)
    .split(/\W+/)
    .filter(word => word && !STOPWORDS.has(word));
}

export function stem(word: string): string {
  return word.replace(/(ing|ed|ly|s)$/g, "")
}

export function processText(text: string) {
  const tokens = tokenize(text);
  const stems = tokens.map(stem)
  return { tokens, stems }
}