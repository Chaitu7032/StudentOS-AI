"use client";

import { useEffect, useId, useState } from "react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { AlertCircle, Expand, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface MermaidDiagramProps {
  chart: string;
  title?: string;
  className?: string;
}

let mermaidInitialized = false;

function hashString(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

async function renderChart(
  id: string,
  chart: string,
  dark: boolean,
): Promise<string> {
  const mermaid = (await import("mermaid")).default;
  const normalizedChart = chart.trim();
  const baseConfig = {
    startOnLoad: false,
    theme: dark ? "dark" : "neutral",
    securityLevel: "strict",
    suppressErrorRendering: true,
  } as const;
  if (!mermaidInitialized) {
    mermaid.initialize({
      ...baseConfig,
      fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
    });
    mermaidInitialized = true;
  } else {
    mermaid.initialize(baseConfig);
  }

  if (!normalizedChart) {
    throw new Error("Empty Mermaid chart");
  }

  if (typeof mermaid.parse === "function") {
    const parsed = await mermaid.parse(normalizedChart, { suppressErrors: true });
    if (parsed === false) {
      throw new Error("Invalid Mermaid syntax");
    }
  }

  const { svg } = await mermaid.render(id, normalizedChart);
  return svg;
}

const MAX_CHART_LENGTH = 12_000;

export function MermaidDiagram({ chart, title, className }: MermaidDiagramProps) {
  const uid = useId().replace(/:/g, "");
  const safeChart = chart.length > MAX_CHART_LENGTH ? chart.slice(0, MAX_CHART_LENGTH) : chart;
  const { resolvedTheme } = useTheme();
  const [result, setResult] = useState<{
    key: string;
    svg: string;
    error: string | null;
  }>({
    key: "",
    svg: "",
    error: null,
  });
  const [expanded, setExpanded] = useState(false);

  const dark = resolvedTheme === "dark";
  const renderKey = `${dark ? "dark" : "light"}:${safeChart}`;
  const renderId = `mmd-${uid}-${hashString(renderKey)}`;
  const loading = result.key !== renderKey;
  const error = result.key === renderKey ? result.error : null;
  const svg = result.key === renderKey ? result.svg : "";

  useEffect(() => {
    let cancelled = false;

    renderChart(renderId, safeChart, dark)
      .then((result) => {
        if (!cancelled) {
          setResult({ key: renderKey, svg: result, error: null });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setResult({
            key: renderKey,
            svg: "",
            error: err instanceof Error ? err.message : "Failed to render diagram",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [dark, renderId, renderKey, safeChart]);

  const diagramBody = (
    <div className="relative min-h-[120px]">
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}
      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <pre className="overflow-x-auto text-xs whitespace-pre-wrap">{error}</pre>
        </div>
      )}
      {!loading && !error && svg && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="flex justify-center overflow-x-auto p-2 [&_svg]:max-w-full"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      )}
    </div>
  );

  return (
    <>
      <div
        className={cn(
          "my-4 overflow-hidden rounded-xl border border-border/50 bg-card/60",
          className,
        )}
      >
        <div className="flex items-center justify-between border-b border-border/40 px-3 py-2">
          <span className="text-xs font-medium text-muted-foreground">
            {title ?? "Diagram"}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setExpanded(true)}
            aria-label="Expand diagram"
          >
            <Expand className="h-3.5 w-3.5" />
          </Button>
        </div>
        {diagramBody}
      </div>

      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{title ?? "Diagram"}</DialogTitle>
          </DialogHeader>
          <div className="overflow-x-auto p-2">{diagramBody}</div>
        </DialogContent>
      </Dialog>
    </>
  );
}
