"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check } from "lucide-react";
import { MermaidDiagram } from "./mermaid-diagram";
import { DIAGRAM_TEMPLATES, type DiagramTemplate } from "@/lib/visual-templates";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const categories = ["all", "flowchart", "architecture", "dsa", "sequence"] as const;

export function DiagramGallery() {
  const [filter, setFilter] = useState<(typeof categories)[number]>("all");
  const [selected, setSelected] = useState<DiagramTemplate | null>(
    DIAGRAM_TEMPLATES[0],
  );
  const [copied, setCopied] = useState(false);

  const filtered =
    filter === "all"
      ? DIAGRAM_TEMPLATES
      : DIAGRAM_TEMPLATES.filter((d) => d.category === filter);

  const copyMermaid = async () => {
    if (!selected) return;
    await navigator.clipboard.writeText(selected.mermaid);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <div className="space-y-2">
        <div className="flex flex-wrap gap-1.5 mb-3">
          {categories.map((cat) => (
            <Button
              key={cat}
              size="sm"
              variant={filter === cat ? "default" : "outline"}
              className="text-xs capitalize"
              onClick={() => setFilter(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>
        {filtered.map((template, i) => (
          <motion.button
            key={template.id}
            type="button"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            onClick={() => setSelected(template)}
            className={cn(
              "w-full rounded-xl border px-3 py-2.5 text-left text-sm transition-colors",
              selected?.id === template.id
                ? "border-primary bg-primary/10"
                : "border-border/50 hover:bg-muted/50",
            )}
          >
            <p className="font-medium">{template.title}</p>
            <Badge variant="secondary" className="mt-1 text-[10px] capitalize">
              {template.category}
            </Badge>
          </motion.button>
        ))}
      </div>

      {selected && (
        <motion.div
          key={selected.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-3"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-semibold">{selected.title}</h3>
              <p className="text-sm text-muted-foreground">{selected.description}</p>
            </div>
            <Button variant="outline" size="sm" onClick={copyMermaid}>
              {copied ? (
                <Check className="h-3.5 w-3.5 mr-1" />
              ) : (
                <Copy className="h-3.5 w-3.5 mr-1" />
              )}
              Copy Mermaid
            </Button>
          </div>
          <MermaidDiagram chart={selected.mermaid} title={selected.title} />
        </motion.div>
      )}
    </div>
  );
}
