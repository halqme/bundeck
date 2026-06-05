import { Marked } from "marked";
import {
  styledHeadingExtension,
  styledSpanExtension,
  containerExtension,
  styledImageExtension,
} from "./extensions";
import { splitTokensToSlides } from "./splitter";
import type { Presentation, PresentationMeta } from "../types";
import { consoleWarn } from "../cli/utils";

function parseScalarValue(value: string): unknown {
  const trimmed = value.trim();

  if (trimmed === "") {
    return "";
  }

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  if (trimmed === "true") {
    return true;
  }

  if (trimmed === "false") {
    return false;
  }

  if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) {
    return Number(trimmed);
  }

  return trimmed;
}

function parseSimpleFrontmatter(yamlPart: string): Record<string, unknown> {
  const data: Record<string, unknown> = {};

  for (const line of yamlPart.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("#")) {
      continue;
    }

    const match = line.match(/^\s*([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
    if (match) {
      data[match[1]!] = parseScalarValue(match[2] ?? "");
    }
  }

  return data;
}

export class MarkdownParser {
  private markedInstance: Marked;

  constructor() {
    this.markedInstance = new Marked();
    this.markedInstance.use({
      extensions: [
        styledHeadingExtension,
        styledSpanExtension,
        containerExtension,
        styledImageExtension,
      ],
    });
  }

  /**
   * Extract frontmatter data and content from raw markdown.
   * Uses Bun.YAML when available and falls back to a small scalar parser.
   */
  private extractFrontmatter(raw: string): { data: Record<string, any>; content: string } {
    const trimmed = raw.trim();
    if (!trimmed.startsWith("---")) {
      return { data: {}, content: raw };
    }

    // Split by the second occurrence of ---
    // Rule: starts with ---, then non-greedy content, then --- on its own line
    const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);

    if (match) {
      try {
        const yamlPart = match[1]!;
        const contentPart = match[2]!;
        const bunWithYaml = Bun as typeof Bun & {
          YAML?: { parse: (input: string) => unknown };
        };
        const data = bunWithYaml.YAML?.parse
          ? ((bunWithYaml.YAML.parse(yamlPart) as Record<string, any>) ?? {})
          : parseSimpleFrontmatter(yamlPart);
        return { data, content: contentPart };
      } catch (e) {
        consoleWarn(`Failed to parse YAML frontmatter: ${(e as Error).message}`);
        return { data: {}, content: raw };
      }
    }

    return { data: {}, content: raw };
  }

  parse(rawMarkdown: string): Presentation {
    // 1. Parse Frontmatter
    const { content, data } = this.extractFrontmatter(rawMarkdown);

    // 2. Tokenize with Marked
    const tokens = this.markedInstance.lexer(content);

    // 3. Split into slides
    const slides = splitTokensToSlides(tokens);

    // 4. Validate
    if (slides.length === 0) {
      consoleWarn(
        "No slides were generated — the markdown may be empty or contain no slide separators (---).",
      );
    }

    // 5. Construct Presentation object
    const meta: PresentationMeta = {
      title: data.title,
      theme: data.theme || "default",
      mode: data.mode, // 'light' | 'dark' | 'auto'
      aspectRatio: data.aspectRatio,
      fontSize: data.fontSize, // 'XS' | 'S' | 'M' | 'L' | 'XL'
      ...data, // Include other frontmatter data
    };

    return {
      meta,
      slides,
    };
  }
}

// Singleton or simple export? Class allows caching instance if needed.
// Let's export a simple function for ease of use, using a singleton instance if needed,
// or just creating a new one (cheap enough).
export function parseMarkdown(src: string): Presentation {
  const parser = new MarkdownParser();
  return parser.parse(src);
}
