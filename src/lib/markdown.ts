import { defaultSchema, type Options as SanitizeOptions } from "rehype-sanitize";

const ALLOWED_LINK_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);

export function safeMarkdownUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("#") || trimmed.startsWith("/")) return trimmed;

  try {
    const parsed = new URL(trimmed);
    return ALLOWED_LINK_PROTOCOLS.has(parsed.protocol) ? trimmed : "";
  } catch {
    return "";
  }
}

export const markdownSanitizeSchema: SanitizeOptions = {
  ...defaultSchema,
  tagNames: (defaultSchema.tagNames ?? []).filter(
    (tag) => !["img", "picture", "source", "iframe", "video", "audio", "input", "script", "style"].includes(tag)
  ),
  attributes: {
    ...defaultSchema.attributes,
    a: ["href", "title"],
    code: ["className"],
    pre: ["className"],
  },
  protocols: {
    ...defaultSchema.protocols,
    href: ["http", "https", "mailto"],
  },
};
