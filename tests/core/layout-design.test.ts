import { describe, it, expect } from "bun:test";
import {
  getContentDensity,
  calculateFontSize,
  getSlideFontSizeAttribute,
  SLIDE_SIZE,
  CONTENT_DENSITY_INFO,
  type ContentDensity,
} from "../../src/core/layout-design";

describe("Font Size Auto-Adjustment System", () => {
  describe("getContentDensity", () => {
    it("should classify sparse content (< 100 chars)", () => {
      expect(getContentDensity(50)).toBe("sparse");
      expect(getContentDensity(99)).toBe("sparse");
    });

    it("should classify normal content (100-299 chars)", () => {
      expect(getContentDensity(100)).toBe("normal");
      expect(getContentDensity(200)).toBe("normal");
      expect(getContentDensity(299)).toBe("normal");
    });

    it("should classify dense content (300-599 chars)", () => {
      expect(getContentDensity(300)).toBe("dense");
      expect(getContentDensity(450)).toBe("dense");
      expect(getContentDensity(599)).toBe("dense");
    });

    it("should classify very-dense content (600+ chars)", () => {
      expect(getContentDensity(600)).toBe("very-dense");
      expect(getContentDensity(1000)).toBe("very-dense");
    });
  });

  describe("calculateFontSize", () => {
    it("should return larger font size for sparse content", () => {
      const sparseSize = calculateFontSize("sparse");
      const denseSize = calculateFontSize("dense");
      expect(sparseSize).toBeGreaterThan(denseSize);
    });

    it("should return appropriate sizes for all densities", () => {
      expect(calculateFontSize("sparse")).toBe(32);
      expect(calculateFontSize("normal")).toBe(24);
      expect(calculateFontSize("dense")).toBe(18);
      expect(calculateFontSize("very-dense")).toBe(14);
    });

    it("should ensure sparse content has largest font size", () => {
      const sizes: number[] = [
        calculateFontSize("sparse"),
        calculateFontSize("normal"),
        calculateFontSize("dense"),
        calculateFontSize("very-dense"),
      ];

      // Test that sizes are in descending order
      expect(sizes[0]!).toBeGreaterThan(sizes[1]!);
      expect(sizes[1]!).toBeGreaterThan(sizes[2]!);
      expect(sizes[2]!).toBeGreaterThan(sizes[3]!);
    });
  });

  describe("getSlideFontSizeAttribute", () => {
    it("should return inline style with font-size", () => {
      const style = getSlideFontSizeAttribute(150);
      expect(style).toMatch(/^font-size: \d+px$/);
    });

    it("should generate different font sizes for different content lengths", () => {
      const shortStyle = getSlideFontSizeAttribute(50); // sparse
      const normalStyle = getSlideFontSizeAttribute(150); // normal
      const denseStyle = getSlideFontSizeAttribute(800); // very-dense

      expect(shortStyle).not.toBe(normalStyle);
      expect(normalStyle).not.toBe(denseStyle);
    });

    it("should handle edge cases", () => {
      expect(() => getSlideFontSizeAttribute(0)).not.toThrow();
      expect(() => getSlideFontSizeAttribute(1000)).not.toThrow();
    });
  });

  describe("SLIDE_SIZE", () => {
    it("should have correct dimensions for 16:9 aspect ratio", () => {
      expect(SLIDE_SIZE.width).toBe(1280);
      expect(SLIDE_SIZE.height).toBe(720);
      expect(SLIDE_SIZE.aspectRatio).toBe("16:9");
    });
  });

  describe("CONTENT_DENSITY_INFO", () => {
    it("should have content length ranges for all densities", () => {
      const ranges = CONTENT_DENSITY_INFO.ranges;
      expect(ranges.sparse).toBeDefined();
      expect(ranges.normal).toBeDefined();
      expect(ranges.dense).toBeDefined();
      expect(ranges["very-dense"]).toBeDefined();
    });

    it("should have descriptions for each density", () => {
      for (const range of Object.values(CONTENT_DENSITY_INFO.ranges)) {
        expect(range.description).toBeDefined();
        expect(typeof range.description).toBe("string");
      }
    });

    it("should have correct max values for ranges", () => {
      expect(CONTENT_DENSITY_INFO.ranges.sparse.max).toBe(100);
      expect(CONTENT_DENSITY_INFO.ranges.normal.max).toBe(300);
      expect(CONTENT_DENSITY_INFO.ranges.dense.max).toBe(600);
      expect(CONTENT_DENSITY_INFO.ranges["very-dense"].max).toBe(Infinity);
    });
  });

  describe("Integration test: content-based font sizing", () => {
    it("should consistently decrease font size as content increases", () => {
      const testCases = [
        { length: 50, expectedDensity: "sparse" as ContentDensity, expectedSize: 32 },
        { length: 150, expectedDensity: "normal" as ContentDensity, expectedSize: 24 },
        { length: 400, expectedDensity: "dense" as ContentDensity, expectedSize: 18 },
        { length: 800, expectedDensity: "very-dense" as ContentDensity, expectedSize: 14 },
      ];

      for (const testCase of testCases) {
        const style = getSlideFontSizeAttribute(testCase.length);
        const fontSizeMatch = style.match(/font-size: (\d+)px/);
        const fontSize = fontSizeMatch ? parseInt(fontSizeMatch[1]!, 10) : 0;

        expect(getContentDensity(testCase.length)).toBe(testCase.expectedDensity);
        expect(fontSize).toBe(testCase.expectedSize);
      }
    });
  });
});
