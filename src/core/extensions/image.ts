import type { TokenizerAndRendererExtension, Tokens } from "marked";
import { attrsToClass } from "./classUtils.js";
import { escapeHtmlAttribute, sanitizeImageUrl } from "../../utils/html.js";

export interface StyledImageToken extends Tokens.Generic {
  type: "styledImage";
  text: string; // alt text
  href: string; // url
  attrs: string;
}

export const styledImageExtension: TokenizerAndRendererExtension = {
  name: "styledImage",
  level: "inline",
  start(src: string) {
    return src.match(/!\[/)?.index;
  },
  tokenizer(src: string) {
    // Example: ![alt](url){.class}
    const rule = /^!\[([^\]]*)\]\(([^)]+)\)\{([.#\w\s-]+)\}/;
    const match = rule.exec(src);
    if (match) {
      return {
        type: "styledImage",
        raw: match[0],
        text: match[1]!,
        href: match[2]!.trim(),
        attrs: match[3]!.trim(),
      };
    }
  },
  renderer(token) {
    const styledToken = token as StyledImageToken;
    // Use attrsToClass to handle numeric parameters (e.g. .opacity 60 -> opacity-60)
    const className = attrsToClass(styledToken.attrs);

    // Place class attribute first to make tests that search for `<img class="...">` deterministic
    const href = sanitizeImageUrl(styledToken.href);
    return `<img class="${className}" src="${escapeHtmlAttribute(href)}" alt="${escapeHtmlAttribute(styledToken.text)}">`;
  },
};
