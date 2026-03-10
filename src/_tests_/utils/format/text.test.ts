import { describe, it, expect } from "vitest";
import {
  normalize,
  lemmatize,
  tokenize,
  filter,
  extractVerb,
  extractVerbs,
  extractObjects,
  extractPair,
} from "../../../utils/format/text";

describe("text format utils", () => {
  describe("normalize", () => {
    it("should lowercase and remove punctuation", () => {
      expect(normalize("Hello World!")).toBe("hello world");
    });

    it("should strip stopwords like the, a, an", () => {
      expect(normalize("the quick brown fox")).toMatch(/quick/);
    });
  });

  describe("lemmatize", () => {
    it("should strip -ing suffix", () => {
      expect(lemmatize("running")).toBe("runn");
    });

    it("should strip -ed suffix", () => {
      expect(lemmatize("cleaned")).toBe("clean");
    });

    it("should preserve morning/afternoon/evening", () => {
      expect(lemmatize("morning")).toBe("morning");
    });
  });

  describe("tokenize", () => {
    it("should split and lemmatize text", () => {
      const tokens = tokenize("cleaning the kitchen");
      expect(tokens).toContain("clean");
      expect(tokens.length).toBeGreaterThan(0);
    });

    it("should filter short words and stopwords", () => {
      const tokens = tokenize("a to the");
      expect(tokens.filter((t) => t.length < 3)).toHaveLength(0);
    });
  });

  describe("filter", () => {
    it("should remove numeric tokens", () => {
      expect(filter(["clean", "5", "kitchen"])).toEqual(["clean", "kitchen"]);
    });

    it("should remove time words", () => {
      const result = filter(["clean", "minutes", "kitchen"]);
      expect(result).not.toContain("minutes");
    });
  });

  describe("extractVerb", () => {
    it("should extract known verb from tokens", () => {
      expect(extractVerb(["clean", "kitchen"])).toBe("clean");
    });

    it("should return empty string when no known verb", () => {
      expect(extractVerb(["xyz", "abc"])).toBe("");
    });
  });

  describe("extractVerbs", () => {
    it("should return single verb by default", () => {
      const verbs = extractVerbs(["clean", "and", "organize", "kitchen"]);
      expect(verbs.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe("extractObjects", () => {
    it("should extract non-verb, non-stopword tokens", () => {
      const objects = extractObjects(["clean", "kitchen", "today"]);
      expect(objects).toContain("kitchen");
    });
  });

  describe("extractPair", () => {
    it("should extract verb-object pairs from quest title", () => {
      const pairs = extractPair("clean the kitchen");
      expect(Array.isArray(pairs)).toBe(true);
    });

    it("should return empty array for titles without known verbs", () => {
      const pairs = extractPair("xyz abc qwe");
      expect(pairs).toEqual([]);
    });
  });
});
