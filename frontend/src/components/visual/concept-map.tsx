"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Network } from "lucide-react";
import { MermaidDiagram } from "./mermaid-diagram";
import { cn } from "@/lib/utils";

export interface ConceptMapItem {
  id: string;
  title: string;
  summary: string;
  mermaid: string;
  tags?: string[];
}

interface ConceptMapProps {
  items: ConceptMapItem[];
  defaultOpen?: string;
}

export function ConceptMap({ items, defaultOpen }: ConceptMapProps) {
  const [openId, setOpenId] = useState<string | null>(defaultOpen ?? null);

  return (
    <div className="space-y-2">
      {items.map((item, i) => {
        const isOpen = openId === item.id;
        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="overflow-hidden rounded-xl border border-border/50 bg-card/40"
          >
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : item.id)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Network className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium truncate">{item.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {item.summary}
                  </p>
                </div>
              </div>
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                  isOpen && "rotate-180",
                )}
              />
            </button>
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden border-t border-border/40"
                >
                  <div className="p-4 space-y-3">
                    <p className="text-sm text-muted-foreground">{item.summary}</p>
                    {item.tags && (
                      <div className="flex flex-wrap gap-1.5">
                        {item.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <MermaidDiagram chart={item.mermaid} title={item.title} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
