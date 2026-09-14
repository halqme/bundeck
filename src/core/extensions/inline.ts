import type { TokenizerAndRendererExtension, Tokens } from "marked";
import { attrsToClass } from "./classUtils.js";

export interface StyledSpanToken extends Tokens.Generic {
  type: "styledSpan";
  text: string;
  attrs: string;
  tokens: Tokens.Generic[];
}

export const styledSpanExtension: TokenizerAndRendererExtension = {
  name: "styledSpan",
  level: "inline",
  start(src: string) {
    return src.match(/\[/)?.index;
  },
  tokenizer(src: string) {
    // Example: [text]{.accent}
    const rule = /^\[([^\]]+)\]\{([.#\w\s-]+)\}/;
    const match = rule.exec(src);
    if (match) {
      const token: StyledSpanToken = {
        type: "styledSpan",
        raw: match[0],
        text: match[1]!,
        attrs: match[2]!.trim(),
        tokens: [],
      };

      // Tokenize inner text as inline tokens
      this.lexer.inline(token.text, token.tokens);

      return token;
    }
  },
  renderer(token) {
    const styledToken = token as StyledSpanToken;
    // Convert attribute string into normalized class list (supports numeric params like `{.opacity 60}`)
    const className = attrsToClass(styledToken.attrs);
    return `<span class="${className}">${this.parser.parseInline(styledToken.tokens)}</span>`;
  },
};
