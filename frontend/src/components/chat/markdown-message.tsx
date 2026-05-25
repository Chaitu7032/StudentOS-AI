"use client";

import { useCallback, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeSanitize from "rehype-sanitize";
import dynamic from "next/dynamic";
import { markdownSanitizeSchema } from "@/lib/sanitize-schema";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MermaidDiagram = dynamic(
  () =>
    import("@/components/visual/mermaid-diagram").then((m) => ({
      default: m.MermaidDiagram,
    })),
  { ssr: false, loading: () => <div className="h-24 animate-pulse rounded-xl bg-muted" /> },
);

const MAX_MERMAID_CHARS = 12_000;

interface MarkdownMessageProps {
  content: string;
  className?: string;
}

function CodeBlock({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode }) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className ?? "");
  const lang = match?.[1]?.toLowerCase();
  const code = String(children).replace(/\n$/, "");

  const copy = useCallback(async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  if (!match) {
    return (
      <code className={cn("rounded bg-muted px-1.5 py-0.5 text-sm", className)} {...props}>
        {children}
      </code>
    );
  }

  if (lang === "mermaid") {
    if (code.length > MAX_MERMAID_CHARS) {
      return (
        <p className="text-sm text-muted-foreground">Diagram too large to render.</p>
      );
    }
    return <MermaidDiagram chart={code} title="AI Diagram" />;
  }

  return (
    <div className="group relative my-4 overflow-hidden rounded-xl border border-border/50 bg-[#0d1117]">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2 text-xs text-muted-foreground">
        <span>{lang}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={copy}
          aria-label="Copy code"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
      </div>
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed">
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    </div>
  );
}

export function MarkdownMessage({ content, className }: MarkdownMessageProps) {
  return (
    <div
      className={cn(
        "prose prose-sm dark:prose-invert max-w-none",
        "prose-headings:font-semibold prose-p:leading-relaxed",
        "prose-pre:p-0 prose-pre:bg-transparent",
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          [rehypeSanitize, markdownSanitizeSchema],
          rehypeHighlight,
        ]}
        components={{
          code: CodeBlock,
          pre: ({ children }) => <>{children}</>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
