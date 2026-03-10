import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { formatDate } from "../../../utils/format/date";

describe("formatDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-03-09T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return '-' for null", () => {
    expect(formatDate(null)).toBe("-");
  });

  it("should return '-' for undefined", () => {
    expect(formatDate(undefined as unknown as null)).toBe("-");
  });

  it("should format timestamp as date string", () => {
    const result = formatDate(new Date("2025-01-15T12:00:00Z").getTime());
    expect(result).not.toBe("-");
    expect(result).toMatch(/15|15th|15\./); // day
    expect(result).toMatch(/2025/); // year
    expect(result.length).toBeGreaterThan(5);
  });

  it("should format date string", () => {
    const result = formatDate("2025-06-20");
    expect(result).toMatch(/Jun/);
    expect(result).toMatch(/20/);
    expect(result).toMatch(/2025/);
  });
});
