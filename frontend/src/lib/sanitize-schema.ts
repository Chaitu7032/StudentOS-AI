import { defaultSchema } from "rehype-sanitize";
import type { Schema } from "hast-util-sanitize";

/** Strict schema for AI-rendered markdown — allows KaTeX math spans, svgs, and clean formatting. */
export const markdownSanitizeSchema: Schema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames ?? []).filter(
      (tag) => !["script", "iframe", "object", "embed", "form", "input"].includes(tag),
    ),
    "math",
    "annotation",
    "semantics",
    "mrow",
    "mi",
    "mn",
    "mo",
    "msup",
    "msub",
    "mfrac",
    "munder",
    "mover",
    "svg",
    "path",
    "g",
    "span",
    "div",
  ],
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code ?? []), "className"],
    span: [...(defaultSchema.attributes?.span ?? []), "className", "style", "aria-hidden"],
    div: [...(defaultSchema.attributes?.div ?? []), "className", "style"],
    math: ["xmlns", "display"],
    svg: ["width", "height", "viewBox", "fill", "xmlns", "className"],
    path: ["d", "fill", "stroke", "strokeWidth"],
    a: [
      ...(defaultSchema.attributes?.a ?? []),
      "href",
      "title",
      "target",
      "rel",
      "className",
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
