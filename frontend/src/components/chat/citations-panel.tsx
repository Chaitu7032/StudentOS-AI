"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Globe, X, FileText } from "lucide-react";
import type { Citation } from "@/types";
import { Button } from "@/components/ui/button";

interface CitationsPanelProps {
  citations: Citation[];
  onClose?: () => void;
}

export function CitationsPanel({ citations, onClose }: CitationsPanelProps) {
  if (!citations || citations.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        className="mb-4 overflow-hidden rounded-xl border border-border/80 bg-muted/30 p-3"
      >
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <FileText className="h-3.5 w-3.5" />
            <span>Sources ({citations.length})</span>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 text-muted-foreground hover:text-foreground"
              onClick={onClose}
              aria-label="Close sources panel"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {citations.map((c) => {
            const isWeb = c.url || c.document_id?.startsWith("web-");
            return (
              <div
                key={`${c.document_id}-${c.chunk_index}-${c.index}`}
                className="group relative flex flex-col justify-between rounded-lg border border-border/70 bg-card p-2.5 text-xs transition-colors hover:border-foreground/20"
              >
                <div>
                  <div className="flex items-center gap-1.5 font-medium text-foreground">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-sm bg-muted text-[10px] font-semibold text-foreground">
                      {c.index}
                    </span>
                    <span className="truncate flex-1">{c.document_title}</span>
                    {isWeb ? (
                      <Globe className="h-3 w-3 shrink-0 text-muted-foreground" />
                    ) : (
                      <span className="shrink-0 text-[10px] text-muted-foreground font-normal">
                        {c.page ? `p. ${c.page}` : `sec. ${c.chunk_index + 1}`}
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                    {c.snippet}
                  </p>
                </div>

                {c.url && (
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="mt-2 inline-flex items-center gap-1 text-[11px] text-foreground/80 hover:underline"
                  >
                    View source <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
