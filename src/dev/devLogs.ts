const isDev = process.env.NODE_ENV === "development";

type logCategory = "quest" | "storage" | "pipeline" | "decay" | "evidence" | "skill" | "skill-gen" | "mastery" | "player" | "streak";

function formatMessage(category: logCategory, message: string, data?: unknown): string {
  const prefix = `[${category}]`;
  if(data === undefined) return `${prefix} ${message}`;
  try {
    return `${prefix} ${message}` + (typeof data === "object" ? " " + JSON.stringify(data) : ` ${String(data)}`);
  } catch {
    return `${prefix} ${message} [unserializable]`;
  }
}

export function devLog(category: logCategory, message: string, data?: unknown): void {
  if (!isDev) return;
  console.log(formatMessage(category, message, data));
}

export function devWarn(category: logCategory, message: string, data?: unknown): void {
  if(!isDev) return;
  console.warn(formatMessage(category, message, data));
}

export function devError(category: logCategory, message: string, data?: unknown): void {
  if(!isDev) return;
  console.error(formatMessage(category, message, data));
}