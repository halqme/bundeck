const HTML_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => HTML_ENTITIES[character]!);
}

export function escapeHtmlAttribute(value: string): string {
  return escapeHtml(value);
}

/**
 * Keep image URLs usable while rejecting executable or otherwise unknown
 * schemes. Relative URLs are allowed for static presentations.
 */
export function sanitizeImageUrl(value: string): string {
  const url = value.trim();
  if (!url) return "";

  // Browsers ignore ASCII controls and whitespace while parsing URLs. Remove
  // them for scheme detection so obfuscated `java\nscript:` values are not
  // mistaken for relative paths.
  const normalizedUrl = Array.from(url)
    .filter((character) => {
      const code = character.charCodeAt(0);
      return code > 0x20 && code !== 0x7f;
    })
    .join("");
  const scheme = normalizedUrl.match(/^([a-z][a-z\d+.-]*):/i)?.[1]?.toLowerCase();
  if (!scheme) return url;

  if (scheme === "http" || scheme === "https") return url;
  if (scheme === "data" && /^data:image\//i.test(normalizedUrl)) return url;

  return "";
}
