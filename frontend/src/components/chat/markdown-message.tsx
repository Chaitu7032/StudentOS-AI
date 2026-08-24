"use client";

import { useCallback, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import rehypeSanitize from "rehype-sanitize";
import dynamic from "next/dynamic";
import { markdownSanitizeSchema } from "@/lib/sanitize-schema";
import { ArrowRight, Check, Copy, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MermaidDiagram = dynamic(
  () =>
    import("@/components/visual/mermaid-diagram").then((m) => ({
      default: m.MermaidDiagram,
    })),
  {
    ssr: false,
    loading: () => <div className="h-28 animate-pulse rounded-xl bg-muted/40" />,
  },
);

interface MarkdownMessageProps {
  content: string;
  className?: string;
  isStreaming?: boolean;
  onSelectPrompt?: (prompt: string) => void;
  onRegenerate?: () => void;
  isLastAssistant?: boolean;
}

function CodeBlock({
  className,
  children,
  isStreaming = false,
  ...props
}: React.HTMLAttributes<HTMLElement> & {
  children?: React.ReactNode;
  isStreaming?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className ?? "");
  const lang = match?.[1]?.toLowerCase();
  const rawCode = String(children).replace(/\n$/, "");

  const copy = useCallback(async () => {
    await navigator.clipboard.writeText(rawCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [rawCode]);

  if (!match) {
    return (
      <code
        className={cn(
          "rounded-md bg-muted px-1.5 py-0.5 font-mono text-[13px] text-foreground font-medium",
          className,
        )}
        {...props}
      >
        {children}
      </code>
    );
  }

  if (lang === "mermaid") {
    if (isStreaming) {
      return (
        <div className="my-4 rounded-xl border border-border/50 bg-muted/20 p-3.5">
          <p className="mb-2 text-xs text-muted-foreground animate-pulse">
            Generating visual diagram...
          </p>
          <pre className="overflow-x-auto text-xs text-muted-foreground font-mono">
            <code>{rawCode}</code>
          </pre>
        </div>
      );
    }
    return <MermaidDiagram chart={rawCode} title="Visual Architecture & Flow" />;
  }

  return (
    <div className="group relative my-4 overflow-hidden rounded-xl border border-border/60 bg-[#0d1117] text-slate-100 shadow-xs">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2 text-xs font-mono text-slate-400">
        <span>{lang}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-slate-400 hover:text-white"
          onClick={copy}
          aria-label="Copy code snippet"
        >
          {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
        </Button>
      </div>
      <pre className="overflow-x-auto p-4 text-xs font-mono leading-relaxed">
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    </div>
  );
}

export function MarkdownMessage({
  content,
  className,
  isStreaming = false,
  onSelectPrompt,
  onRegenerate,
  isLastAssistant = false,
}: MarkdownMessageProps) {
  const [copied, setCopied] = useState(false);

  // Extract follow-up question suggestions from the end of the text if present
  const { mainContent, followUps } = useMemo(() => {
    if (!content || isStreaming) {
      return { mainContent: content, followUps: [] };
    }

    const triggerMatch = content.match(
      /(?:\*\*Suggested Next Steps:\*\*|\*\*Follow-up Questions:\*\*|\*\*Suggested questions:\*\*)\s*([\s\S]*)$/i,
    );

    if (triggerMatch && triggerMatch.index !== undefined) {
      const main = content.slice(0, triggerMatch.index).trim();
      const followUpBlock = triggerMatch[1];
      const questions = followUpBlock
        .split("\n")
        .map((l) => l.replace(/^[-*•\d\.\s]+/, "").trim())
        .filter((q) => q.length > 5 && q.length < 120);

      return { mainContent: main, followUps: questions.slice(0, 3) };
    }

    return { mainContent: content, followUps: [] };
  }, [content, isStreaming]);

  const copyFullMessage = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div
        className={cn(
          "prose prose-sm dark:prose-invert max-w-none",
          "prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-foreground",
          "prose-h2:text-lg prose-h2:mt-6 prose-h2:mb-3",
          "prose-h3:text-base prose-h3:mt-4 prose-h3:mb-2",
          "prose-p:leading-relaxed prose-p:my-3 prose-p:text-foreground/90",
          "prose-li:my-1 prose-ul:my-2 prose-ol:my-2",
          "prose-pre:p-0 prose-pre:bg-transparent",
          "prose-table:w-full prose-table:border-collapse",
          "prose-th:border prose-th:border-border/60 prose-th:bg-muted/40 prose-th:px-3 prose-th:py-2 prose-th:text-xs",
          "prose-td:border prose-td:border-border/40 prose-td:px-3 prose-td:py-2 prose-td:text-xs",
        )}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[
            [rehypeSanitize, markdownSanitizeSchema],
            rehypeHighlight,
            rehypeKatex,
          ]}
          components={{
            code: (props) => <CodeBlock {...props} isStreaming={isStreaming} />,
            pre: ({ children }) => <>{children}</>,
            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noreferrer noopener"
                className="font-medium text-primary underline underline-offset-4 hover:opacity-80 transition-opacity"
              >
                {children}
              </a>
            ),
          }}
        >
          {mainContent || (isStreaming ? "" : "...")}
        </ReactMarkdown>
      </div>

      {/* Suggested Follow-up Questions */}
      {followUps.length > 0 && !isStreaming && onSelectPrompt && (
        <div className="pt-2">
          <p className="text-xs font-medium text-muted-foreground mb-2">Suggested follow-ups:</p>
          <div className="flex flex-wrap gap-2">
            {followUps.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectPrompt(q)}
                className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-muted/30 px-3 py-1.5 text-xs text-foreground/80 hover:bg-muted/70 hover:text-foreground hover:border-primary/40 transition-colors text-left"
              >
                <span>{q}</span>
                <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Action Bar on complete Assistant response */}
      {!isStreaming && content && (
        <div className="flex items-center gap-2 pt-1 border-t border-border/30 text-xs text-muted-foreground">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={copyFullMessage}
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copy response
              </>
            )}
          </Button>

          {isLastAssistant && onRegenerate && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={onRegenerate}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Regenerate
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
