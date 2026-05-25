"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, TrendingUp } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function TopicTracker() {
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("general");

  const { data: topics = [], isLoading } = useQuery({
    queryKey: ["topics"],
    queryFn: () => api.listTopics(token!),
    enabled: !!token,
  });

  const createMutation = useMutation({
    mutationFn: () => api.createTopic(token!, { name, category }),
    onSuccess: () => {
      setName("");
      queryClient.invalidateQueries({ queryKey: ["topics"] });
      queryClient.invalidateQueries({ queryKey: ["progress-overview"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteTopic(token!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["topics"] });
      queryClient.invalidateQueries({ queryKey: ["progress-overview"] });
    },
  });

  const practiceMutation = useMutation({
    mutationFn: (id: string) => api.updateTopic(token!, id, { practice: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["topics"] });
      queryClient.invalidateQueries({ queryKey: ["progress-overview"] });
    },
  });

  const weakTopics = topics.filter((t) => t.is_weak);

  return (
    <div className="space-y-6">
      <GlassCard className="p-4" glow>
        <h3 className="font-semibold mb-3">Add topic</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <Label htmlFor="topic-name">Topic name</Label>
            <Input
              id="topic-name"
              className="mt-1"
              placeholder="e.g. Dynamic Programming"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="topic-cat">Category</Label>
            <Input
              id="topic-cat"
              className="mt-1"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>
        </div>
        <Button
          className="mt-3"
          size="sm"
          disabled={!name.trim() || createMutation.isPending}
          onClick={() => createMutation.mutate()}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add topic
        </Button>
      </GlassCard>

      {weakTopics.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-amber-500 mb-2">
            Weak topics ({weakTopics.length})
          </h3>
          <div className="space-y-2">
            {weakTopics.map((topic) => (
              <TopicRow
                key={topic.id}
                topic={topic}
                onPractice={() => practiceMutation.mutate(topic.id)}
                onDelete={() => deleteMutation.mutate(topic.id)}
              />
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-sm font-medium mb-2">All topics</h3>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : topics.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No topics yet. Add subjects you are studying.
          </p>
        ) : (
          <div className="space-y-2">
            {topics.map((topic) => (
              <TopicRow
                key={topic.id}
                topic={topic}
                onPractice={() => practiceMutation.mutate(topic.id)}
                onDelete={() => deleteMutation.mutate(topic.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TopicRow({
  topic,
  onPractice,
  onDelete,
}: {
  topic: { id: string; name: string; category: string; mastery_score: number; is_weak: boolean; practice_count: number };
  onPractice: () => void;
  onDelete: () => void;
}) {
  return (
    <GlassCard className="flex items-center gap-4 p-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium truncate">{topic.name}</p>
          {topic.is_weak && (
            <Badge variant="destructive" className="text-[10px]">
              Weak
            </Badge>
          )}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <div className="h-1.5 flex-1 max-w-[120px] rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                topic.mastery_score >= 70
                  ? "bg-green-500"
                  : topic.mastery_score >= 40
                    ? "bg-amber-500"
                    : "bg-red-500",
              )}
              style={{ width: `${topic.mastery_score}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">{topic.mastery_score}%</span>
          <span className="text-xs text-muted-foreground">· {topic.practice_count} sessions</span>
        </div>
      </div>
      <Button variant="outline" size="sm" onClick={onPractice}>
        <TrendingUp className="h-3.5 w-3.5 mr-1" />
        Practice
      </Button>
      <Button variant="ghost" size="icon" onClick={onDelete}>
        <Trash2 className="h-4 w-4 text-muted-foreground" />
      </Button>
    </GlassCard>
  );
}
