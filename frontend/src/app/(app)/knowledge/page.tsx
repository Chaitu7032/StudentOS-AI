"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { BookOpen, Database, Layers } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { DocumentUpload } from "@/components/knowledge/document-upload";
import { DocumentList } from "@/components/knowledge/document-list";
import { GlassCard } from "@/components/ui/glass-card";

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
    <div className="h-full overflow-y-auto">
      <div className="mesh-gradient pointer-events-none fixed inset-0 opacity-30" />
      <div className="relative mx-auto max-w-4xl space-y-8 p-6 md:p-10">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-card">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                Knowledge Workspace
              </h1>
              <p className="text-muted-foreground">
                Upload PDFs and notes to power contextual answers with citations
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2">
          <GlassCard className="flex items-center gap-4 p-4">
            <Database className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{stats?.document_count ?? 0}</p>
              <p className="text-sm text-muted-foreground">Documents</p>
            </div>
          </GlassCard>
          <GlassCard className="flex items-center gap-4 p-4">
            <Layers className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{stats?.chunk_count ?? 0}</p>
              <p className="text-sm text-muted-foreground">Indexed chunks</p>
            </div>
          </GlassCard>
        </div>

        <DocumentUpload onUploaded={refresh} />

        <div>
          <h2 className="mb-4 text-lg font-semibold">Your library</h2>
          <DocumentList
            documents={documents}
            isLoading={isLoading}
            onDelete={(id) => deleteMutation.mutate(id)}
            deletingId={deletingId}
          />
        </div>

        <GlassCard className="p-5 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">How RAG works</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>Documents are split into chunks and embedded with sentence-transformers</li>
            <li>Semantic search finds the most relevant excerpts via pgvector</li>
            <li>Enable &quot;Use my knowledge base&quot; in chat for citation-style answers</li>
          </ul>
        </GlassCard>
      </div>
    </div>
  );
}
