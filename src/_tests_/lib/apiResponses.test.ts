import { describe, expect, it } from "vitest";
import { errorJson, parseJsonBody } from "@/lib/apiResponses";

describe("apiResponses", () => {
  it("builds consistent error payloads", async () => {
    const res = errorJson("invalid_payload", 400);
    const json = (await res.json()) as { ok: boolean; error: string };
    expect(res.status).toBe(400);
    expect(json).toEqual({ ok: false, error: "invalid_payload" });
  });

  it("parses valid json body", async () => {
    const req = new Request("https://example.test", {
      method: "POST",
      body: JSON.stringify({ ok: true }),
      headers: { "content-type": "application/json" },
    });
    const parsed = await parseJsonBody(req);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.data).toEqual({ ok: true });
    }
  });

  it("returns invalid_json response for malformed body", async () => {
    const req = new Request("https://example.test", {
      method: "POST",
      body: "{bad json",
      headers: { "content-type": "application/json" },
    });
    const parsed = await parseJsonBody(req);
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(parsed.response.status).toBe(400);
      const json = (await parsed.response.json()) as { ok: boolean; error: string };
      expect(json).toEqual({ ok: false, error: "invalid_json" });
    }
  });
});
