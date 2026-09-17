import { describe, it, expect } from "bun:test";
import { ServerHTMLGenerator } from "../../src/server/generator";
import type { Presentation } from "../../src/types";

describe("ServerHTMLGenerator", () => {
  const mockPresentation: Presentation = {
    meta: {
      title: "Server Test",
      theme: "default",
    },
    slides: [
      {
        id: 1,
        contentTokens: [],
        noteTokens: [],
        contentLength: 50,
      },
    ],
  };

  it("should generate HTML string", async () => {
    const generator = new ServerHTMLGenerator();
    const result = await generator.generate(mockPresentation);

    expect(typeof result).toBe("string");
    const html = result as string;
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("Server Test");
    // Ensure runtime script is embedded (checking a keyword likely in the runtime)
    expect(html).toContain("<script>");
  });

  it("should isolate the browser runtime from window globals", async () => {
    const generator = new ServerHTMLGenerator();
    const result = (await generator.generate(mockPresentation)) as string;
    const scriptStart = result.indexOf("<script>") + "<script>".length;
    const scriptEnd = result.indexOf("</script>", scriptStart);

    expect(scriptStart).toBeGreaterThan("<script>".length - 1);
    expect(scriptEnd).toBeGreaterThan(scriptStart);
    expect(result.slice(scriptStart, scriptEnd).trimStart()).toStartWith("(() => {");
  });

  it("should handle options correctly", async () => {
    const generator = new ServerHTMLGenerator({ inlineAssets: false });
    const result = await generator.generate(mockPresentation);

    expect(typeof result).toBe("object");
    expect(result).toHaveProperty("html");
    expect(result).toHaveProperty("assets");
  });
});
