import { describe, it, expect } from "vitest";
import {
  questRowIdFromClientId,
  stableUuidFromSeed,
} from "../../lib/questRowId";

describe("questRowIdFromClientId", () => {
  it("passes through valid UUIDs (lowercased)", () => {
    const u = "E1000001-0000-4000-8000-000000000001";
    expect(questRowIdFromClientId(u)).toBe(
      "e1000001-0000-4000-8000-000000000001"
    );
  });

  it("maps non-UUID string ids deterministically", () => {
    const a = questRowIdFromClientId("seasonal-spring-cleaning-1774062207117");
    const b = questRowIdFromClientId("seasonal-spring-cleaning-1774062207117");
    expect(a).toBe(b);
    expect(a).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    );
  });

  it("stableUuidFromSeed namespaces collide with different namespaces", () => {
    const x = stableUuidFromSeed("a", "same");
    const y = stableUuidFromSeed("b", "same");
    expect(x).not.toBe(y);
  });
});
