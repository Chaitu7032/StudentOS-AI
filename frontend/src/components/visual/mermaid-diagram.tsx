"use client";

import { useEffect, useId, useState } from "react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { Check, Copy, Expand, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { repairMermaidChart } from "@/lib/mermaid-repair";

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
  const repairedChart = repairMermaidChart(chart);

  const baseConfig = {
    startOnLoad: false,
    theme: dark ? "dark" : "neutral",
    securityLevel: "loose",
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

  if (!repairedChart) {
    throw new Error("Empty Mermaid diagram");
  }

  // Attempt initial render with repaired chart
  try {
    const { svg } = await mermaid.render(id, repairedChart);
    return svg;
  } catch (primaryErr) {
    // If primary failed, attempt basic fallback flowchart wrapping
    const fallbackId = `${id}-fb`;
    const lines = repairedChart.split("\n").filter((l) => l.includes("-->") || l.includes("---"));
    if (lines.length > 0) {
      const fallbackCode = `flowchart TD\n${lines.join("\n")}`;
      try {
        const { svg } = await mermaid.render(fallbackId, fallbackCode);
        return svg;
      } catch {
        // Continue to throw primary error if fallback also failed
      }
    }
    throw primaryErr;
  }
}

const MAX_CHART_LENGTH = 16_000;

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
  const [copied, setCopied] = useState(false);

  const dark = resolvedTheme === "dark";
  const renderKey = `${dark ? "dark" : "light"}:${safeChart}`;
  const renderId = `mmd-${uid}-${hashString(renderKey)}`;
  const loading = result.key !== renderKey;
  const error = result.key === renderKey ? result.error : null;
  const svg = result.key === renderKey ? result.svg : "";

  useEffect(() => {
    let cancelled = false;

    renderChart(renderId, safeChart, dark)
      .then((res) => {
        if (!cancelled) {
          setResult({ key: renderKey, svg: res, error: null });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setResult({
            key: renderKey,
            svg: "",
            error: err instanceof Error ? err.message : "Diagram rendering failed",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [dark, renderId, renderKey, safeChart]);

  const copyCode = async () => {
    await navigator.clipboard.writeText(safeChart);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const diagramBody = (
    <div className="relative min-h-[100px]">
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}
      {error && (
        <div className="p-4 text-xs text-muted-foreground">
          <p className="font-medium text-foreground mb-1">Visual Diagram Source:</p>
          <pre className="overflow-x-auto rounded-lg bg-muted/40 p-3 font-mono text-[11px] leading-relaxed">
            {safeChart}
          </pre>
        </div>
      )}
      {!loading && !error && svg && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="flex justify-center overflow-x-auto p-4 [&_svg]:max-w-full [&_svg]:h-auto"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      )}
    </div>
  );

  return (
    <>
      <div
        className={cn(
          "my-4 overflow-hidden rounded-xl border border-border/60 bg-muted/20 backdrop-blur-xs",
          className,
        )}
      >
        <div className="flex items-center justify-between border-b border-border/40 px-3.5 py-2 text-xs text-muted-foreground">
          <span className="font-medium">{title ?? "Visual Diagram"}</span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              onClick={copyCode}
              aria-label="Copy Mermaid code"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              onClick={() => setExpanded(true)}
              aria-label="Expand diagram"
            >
              <Expand className="h-3 w-3" />
            </Button>
          </div>
        </div>
        {diagramBody}
      </div>

      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{title ?? "Visual Diagram"}</DialogTitle>
          </DialogHeader>
          <div className="overflow-x-auto p-4">{diagramBody}</div>
        </DialogContent>
      </Dialog>
    </>
  );
}
