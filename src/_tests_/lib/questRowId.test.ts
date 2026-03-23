import { describe, it, expect } from "vitest";
import {
  questRowIdFromClientId,
  skillRowIdFromClientId,
  stableUuidFromSeed,
} from "../../lib/questRowId";

const testerA = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const testerB = "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb";

describe("questRowIdFromClientId", () => {
  it("is stable for the same tester and client id", () => {
    const id = "seasonal-spring-cleaning-1774062207117";
    expect(questRowIdFromClientId(id, testerA)).toBe(
      questRowIdFromClientId(id, testerA),
    );
  });

  it("differs across testers for the same client id (global PK uniqueness)", () => {
    const id = "tutorial-tutorial-01-first-loop";
    const a = questRowIdFromClientId(id, testerA);
    const b = questRowIdFromClientId(id, testerB);
    expect(a).not.toBe(b);
    expect(a).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it("namespaces UUID-shaped client ids so they are not global raw keys", () => {
    const u = "e1000001-0000-4000-8000-000000000001";
    const rowA = questRowIdFromClientId(u, testerA);
    const rowB = questRowIdFromClientId(u, testerB);
    expect(rowA).not.toBe(u.toLowerCase());
    expect(rowA).not.toBe(rowB);
  });

  it("stableUuidFromSeed namespaces collide with different namespaces", () => {
    const x = stableUuidFromSeed("a", "same");
    const y = stableUuidFromSeed("b", "same");
    expect(x).not.toBe(y);
  });
});

describe("skillRowIdFromClientId", () => {
  it("differs across testers for the same client skill id", () => {
    const id = "00000000-0000-4000-8000-000000000001";
    expect(skillRowIdFromClientId(id, testerA)).not.toBe(
      skillRowIdFromClientId(id, testerB),
    );
  });
});
