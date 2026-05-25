"use client";

import { motion, AnimatePresence } from "framer-motion";
import { BookMarked, X } from "lucide-react";
import type { Citation } from "@/types";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CitationsPanelProps {
  citations: Citation[];
  onClose?: () => void;
}

export function CitationsPanel({ citations, onClose }: CitationsPanelProps) {
  if (citations.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        className="mb-3"
      >
        <GlassCard className="p-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <BookMarked className="h-4 w-4 text-primary" />
              Sources from your knowledge base
            </div>
            {onClose && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
          <div className="space-y-2">
            {citations.map((c) => (
              <div
                key={`${c.document_id}-${c.chunk_index}`}
                className="rounded-lg border border-border/40 bg-muted/30 px-3 py-2 text-xs"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">
                    [{c.index}]
                  </Badge>
                  <span className="font-medium truncate">{c.document_title}</span>
                  <span className="text-muted-foreground">
                    · {(c.score * 100).toFixed(0)}% match
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-muted-foreground">{c.snippet}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      </motion.div>
    </AnimatePresence>
  );
}
