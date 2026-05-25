import { defaultSchema } from "rehype-sanitize";
import type { Schema } from "hast-util-sanitize";

/** Strict schema for AI-rendered markdown — blocks scripts, iframes, event handlers. */
export const markdownSanitizeSchema: Schema = {
  ...defaultSchema,
  tagNames: (defaultSchema.tagNames ?? []).filter(
    (tag) => !["script", "iframe", "object", "embed", "form", "input"].includes(tag),
  ),
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code ?? []), "className"],
    span: [...(defaultSchema.attributes?.span ?? []), "className"],
    a: [
      ...(defaultSchema.attributes?.a ?? []),
      "href",
      "title",
      "target",
      "rel",
    ],
  },
  protocols: {
    href: ["http", "https", "mailto"],
    cite: ["http", "https"],
    src: ["http", "https"],
  },
  clobber: ["name", "id"],
  clobberPrefix: "user-content-",
};
