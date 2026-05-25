"use client";

import { format } from "date-fns";
import { FileText, Loader2, Trash2 } from "lucide-react";
import type { KnowledgeDocument } from "@/types";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface DocumentListProps {
  documents: KnowledgeDocument[];
  isLoading: boolean;
  onDelete: (id: string) => void;
  deletingId: string | null;
}

export function DocumentList({
  documents,
  isLoading,
  onDelete,
  deletingId,
}: DocumentListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((n) => (
          <Skeleton key={n} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <GlassCard className="p-8 text-center">
        <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
        <p className="mt-4 font-medium">No documents yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload PDFs or paste notes to power contextual AI answers.
        </p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-2">
      {documents.map((doc) => (
        <GlassCard
          key={doc.id}
          className="flex items-center justify-between gap-4 p-4"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{doc.title}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary" className="text-[10px]">
                {doc.file_type ?? "text"}
              </Badge>
              <span>{doc.chunk_count} chunks</span>
              <span>{format(new Date(doc.created_at), "MMM d, yyyy")}</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(doc.id)}
            disabled={deletingId === doc.id}
            aria-label="Delete document"
          >
            {deletingId === doc.id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </GlassCard>
      ))}
    </div>
  );
}
