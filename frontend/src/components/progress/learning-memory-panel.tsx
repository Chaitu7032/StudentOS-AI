"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Brain, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function LearningMemoryPanel() {
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");

  const { data: memories = [] } = useQuery({
    queryKey: ["memories"],
    queryFn: () => api.listMemories(token!),
    enabled: !!token,
  });

  const addMutation = useMutation({
    mutationFn: () => api.addMemory(token!, content),
    onSuccess: () => {
      setContent("");
      queryClient.invalidateQueries({ queryKey: ["memories"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteMemory(token!, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["memories"] }),
  });

  return (
    <div className="space-y-6">
      <GlassCard className="p-4" glow>
        <h3 className="font-semibold flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          Learning memory
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Save facts, preferences, and insights the AI should remember about your learning style.
        </p>
        <Textarea
          className="mt-3 min-h-[80px]"
          placeholder="e.g. I learn best with examples before theory. Struggle with recursion."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <Button
          className="mt-2"
          size="sm"
          disabled={!content.trim() || addMutation.isPending}
          onClick={() => addMutation.mutate()}
        >
          Save memory
        </Button>
      </GlassCard>

      <div className="space-y-2">
        {memories.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No memories saved yet.
          </p>
        ) : (
          memories.map((m) => (
            <GlassCard key={m.id} className="flex gap-3 p-3">
              <p className="flex-1 text-sm">{m.content}</p>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={() => deleteMutation.mutate(m.id)}
              >
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </GlassCard>
          ))
        )}
      </div>
    </div>
  );
}
