import { describe, it, expect } from "bun:test";
import {
  parseAspectRatio,
  parseAspectRatioDetailed,
  generateAspectRatioCSSVariables,
  isPresetAspectRatio,
  PRESET_ASPECT_RATIOS,
} from "../../src/utils/aspect-ratio";

describe("Aspect Ratio Utilities", () => {
  describe("parseAspectRatio", () => {
    it("should return default dimensions for undefined input", () => {
      const result = parseAspectRatio(undefined);
      expect(result).toEqual({ width: 1280, height: 720 });
    });

    it("should return default dimensions for empty string", () => {
      const result = parseAspectRatio("");
      expect(result).toEqual({ width: 1280, height: 720 });
    });

    it("should parse 16:9 correctly", () => {
      const result = parseAspectRatio("16:9");
      expect(result).toEqual({ width: 1280, height: 720 });
    });

    it("should parse 4:3 correctly", () => {
      const result = parseAspectRatio("4:3");
      expect(result).toEqual({ width: 960, height: 720 }); // 720 * 4 / 3 = 960
    });

    it("should parse 1:1 correctly", () => {
      const result = parseAspectRatio("1:1");
      expect(result).toEqual({ width: 720, height: 720 });
    });

    it("should parse 21:9 correctly", () => {
      const result = parseAspectRatio("21:9");
      expect(result).toEqual({ width: 1680, height: 720 }); // 720 * 21 / 9 = 1680
    });

    it("should handle decimal values", () => {
      const result = parseAspectRatio("1.5:1");
      expect(result).toEqual({ width: 1080, height: 720 }); // 720 * 1.5 / 1 = 1080
    });

    it("should return default for invalid format", () => {
      const result = parseAspectRatio("invalid");
      expect(result).toEqual({ width: 1280, height: 720 });
    });

    it("should return default for zero values", () => {
      const result = parseAspectRatio("0:0");
      expect(result).toEqual({ width: 1280, height: 720 });
    });

    it("should return default for negative values", () => {
      const result = parseAspectRatio("-16:9");
      expect(result).toEqual({ width: 1280, height: 720 });
    });
  });

  describe("parseAspectRatioDetailed", () => {
    it("should return detailed information", () => {
      const result = parseAspectRatioDetailed("4:3");
      expect(result).toEqual({
        ratio: "4:3",
        width: 960,
        height: 720,
      });
    });

    it("should use default ratio for undefined input", () => {
      const result = parseAspectRatioDetailed(undefined);
      expect(result).toEqual({
        ratio: "16:9",
        width: 1280,
        height: 720,
      });
    });
  });

  describe("generateAspectRatioCSSVariables", () => {
    it("should generate CSS variables for 16:9", () => {
      const result = generateAspectRatioCSSVariables("16:9");
      expect(result).toEqual({
        "--slide-width": "1280px",
        "--slide-height": "720px",
        "--slide-ratio-w": "1280",
        "--slide-ratio-h": "720",
      });
    });

    it("should generate CSS variables for 4:3", () => {
      const result = generateAspectRatioCSSVariables("4:3");
      expect(result).toEqual({
        "--slide-width": "960px",
        "--slide-height": "720px",
        "--slide-ratio-w": "960",
        "--slide-ratio-h": "720",
      });
    });

    it("should generate default CSS variables for undefined", () => {
      const result = generateAspectRatioCSSVariables(undefined);
      expect(result).toEqual({
        "--slide-width": "1280px",
        "--slide-height": "720px",
        "--slide-ratio-w": "1280",
        "--slide-ratio-h": "720",
      });
    });
  });

  describe("isPresetAspectRatio", () => {
    it("should return true for preset aspect ratios", () => {
      expect(isPresetAspectRatio("16:9")).toBe(true);
      expect(isPresetAspectRatio("4:3")).toBe(true);
      expect(isPresetAspectRatio("1:1")).toBe(true);
      expect(isPresetAspectRatio("21:9")).toBe(true);
      expect(isPresetAspectRatio("3:2")).toBe(true);
    });

    it("should return false for non-preset aspect ratios", () => {
      expect(isPresetAspectRatio("5:4")).toBe(false);
      expect(isPresetAspectRatio("2:1")).toBe(false);
      expect(isPresetAspectRatio("invalid")).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(isPresetAspectRatio(undefined)).toBe(false);
    });
  });

  describe("PRESET_ASPECT_RATIOS", () => {
    it("should contain all expected presets", () => {
      expect(PRESET_ASPECT_RATIOS["16:9"]).toEqual({ width: 1280, height: 720 });
      expect(PRESET_ASPECT_RATIOS["4:3"]).toEqual({ width: 1024, height: 768 });
      expect(PRESET_ASPECT_RATIOS["1:1"]).toEqual({ width: 720, height: 720 });
      expect(PRESET_ASPECT_RATIOS["21:9"]).toEqual({ width: 1680, height: 720 });
      expect(PRESET_ASPECT_RATIOS["3:2"]).toEqual({ width: 1080, height: 720 });
    });
  });
});
