const PREFIX = "QB-";

export function normalizePlayerCodeInput(raw: string): string {
  const t = raw.trim().toUpperCase().replace(/\s+/g, "");
  if (!t) return "";
  const stripped = t.replace(/^QB-?/, "");
  if (!/^[0-9A-F]{8}$/.test(stripped)) return "";
  return `${PREFIX}${stripped}`;
}
