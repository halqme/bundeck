import type { TokenizerAndRendererExtension, Tokens } from "marked";
import { attrsToClass } from "./classUtils";

// Custom token interface
export interface StyledHeadingToken extends Tokens.Generic {
  type: "styledHeading";
  depth: number;
  text: string;
  attrs: string;
  tokens: Tokens.Generic[];
}

export const styledHeadingExtension: TokenizerAndRendererExtension = {
  name: "styledHeading",
  level: "block",
  start(src: string) {
    return src.match(/#/)?.index;
  },
  tokenizer(src: string) {
    // Example: # Title {.center}
    const rule = /^(#{1,6})\s+(.+?)\s+\{([.&#\w\s-]+)\}(?:\n|$)/;
    const match = rule.exec(src);
    if (match) {
      const token: StyledHeadingToken = {
        type: "styledHeading",
        raw: match[0],
        depth: (match[1] as string).length,
        text: (match[2] as string).trim(),
        attrs: (match[3] as string).trim(),
        tokens: [],
      };

      // Parse inline content within the heading
      this.lexer.inline(token.text, token.tokens);

      return token;
    }
  },
  renderer(token) {
    const styledToken = token as StyledHeadingToken;
    // Convert attribute string into normalized class list (supports numeric params like `{.opacity 60}`)
    const className = attrsToClass(styledToken.attrs);
    // Use parseInline to render the inner content
    return `<h${styledToken.depth} class="${className}">${this.parser.parseInline(styledToken.tokens)}</h${styledToken.depth}>
`;
  },
};
