"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { BookOpen, Database, Layers } from "lucide-react";
import { useState } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { DocumentUpload } from "@/components/knowledge/document-upload";
import { DocumentList } from "@/components/knowledge/document-list";

export default function KnowledgePage() {
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: () => api.listDocuments(token!),
    enabled: !!token,
  });

  const { data: stats } = useQuery({
    queryKey: ["knowledge-stats"],
    queryFn: () => api.knowledgeStats(token!),
    enabled: !!token,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteDocument(token!, id),
    onMutate: (id) => setDeletingId(id),
    onSettled: () => {
      setDeletingId(null);
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["knowledge-stats"] });
    },
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["documents"] });
    queryClient.invalidateQueries({ queryKey: ["knowledge-stats"] });
  };

  return (
    <div className="h-full w-full min-w-0 overflow-y-auto">
      <div className="app-shell">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/80 bg-card shadow-xs">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl text-foreground">
                Knowledge Base & Notes
              </h1>
              <p className="text-xs text-muted-foreground">
                Upload PDFs, markdown files, and lecture notes to query with citations in AI Chat.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stats Row */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-4 rounded-xl border border-border/70 bg-card p-4 shadow-xs">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats?.document_count ?? 0}</p>
              <p className="text-xs text-muted-foreground">Uploaded Documents</p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-xl border border-border/70 bg-card p-4 shadow-xs">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats?.chunk_count ?? 0}</p>
              <p className="text-xs text-muted-foreground">Indexed Vector Chunks</p>
            </div>
          </div>
        </div>

        {/* Upload Component */}
        <DocumentUpload onUploaded={refresh} />

        {/* Library */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Your Library</h2>
          <DocumentList
            documents={documents}
            isLoading={isLoading}
            onDelete={(id) => deleteMutation.mutate(id)}
            deletingId={deletingId}
          />
        </div>
      </div>
    </div>
  );
}
