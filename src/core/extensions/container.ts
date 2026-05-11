import type { TokenizerAndRendererExtension, Tokens } from "marked";
import { attrsToClass } from "./classUtils";

export interface ContainerToken extends Tokens.Generic {
  type: "container";
  kind: string;
  tokens: Tokens.Generic[];
}

export const containerExtension: TokenizerAndRendererExtension = {
  name: "container",
  level: "block",
  start(src: string) {
    return src.match(/^:::/)?.index;
  },
  tokenizer(src: string) {
    // Example: ::: speaker \n ... \n ::
    // Example: ::: .mark \n ... \n ::
    // Supports variable length fences (::: vs :::: etc) for nesting
    const opening = /^(:{3,})\s+([^\r\n]+)\r?\n/.exec(src);
    if (!opening) {
      return;
    }

    const fence = opening[1]!;
    const rawKind = opening[2]!.trim();
    if (!rawKind) {
      return;
    }

    // Named container (e.g. "speaker") is strict to avoid accidental captures.
    if (!rawKind.startsWith(".") && !/^[A-Za-z0-9_-]+$/.test(rawKind)) {
      return;
    }

    const normalizedKind = rawKind.startsWith(".") ? attrsToClass(rawKind) : rawKind;
    if (!normalizedKind) {
      return;
    }

    const content = src.slice(opening[0].length);
    let cursor = 0;
    let closingStart = -1;
    let closingLineEnd = -1;

    while (cursor <= content.length) {
      const nextLineBreak = content.indexOf("\n", cursor);
      const lineEnd = nextLineBreak === -1 ? content.length : nextLineBreak;
      let line = content.slice(cursor, lineEnd);
      if (line.endsWith("\r")) {
        line = line.slice(0, -1);
      }

      if (line.trim() === fence) {
        closingStart = cursor;
        closingLineEnd = lineEnd;
        break;
      }

      if (nextLineBreak === -1) {
        break;
      }
      cursor = nextLineBreak + 1;
    }

    if (closingStart === -1) {
      return;
    }

    const rawEnd = opening[0].length + closingLineEnd + (closingLineEnd < content.length ? 1 : 0);
    const token: ContainerToken = {
      type: "container",
      raw: src.slice(0, rawEnd),
      kind: normalizedKind,
      tokens: [],
    };

    this.lexer.blockTokens(content.slice(0, closingStart).trim(), token.tokens);

    return token;
  },
  renderer(token) {
    const containerToken = token as ContainerToken;
    return `<div class="${containerToken.kind}">${this.parser.parse(containerToken.tokens)}</div>`;
  },
};
