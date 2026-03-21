import { throwIfUnauthorized } from "./sessionRecovery";

export async function submitFeedback(input: {
  kind: "feedback" | "problem";
  body: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await fetch("/api/me/feedback", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  await throwIfUnauthorized(res);
  const json = (await res.json()) as { ok?: boolean; error?: string };
  if(!res.ok || !json.ok){
    return { ok: false, error: json.error ?? "unknown" };
  }
  return { ok: true };
}