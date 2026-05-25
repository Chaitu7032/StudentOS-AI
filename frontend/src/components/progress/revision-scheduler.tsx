"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { Calendar, Check } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

function getTomorrowDate() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return format(tomorrow, "yyyy-MM-dd");
}

export function RevisionScheduler() {
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(getTomorrowDate);

  const { data: revisions = [] } = useQuery({
    queryKey: ["revisions"],
    queryFn: () => api.listRevisions(token!),
    enabled: !!token,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.createRevision(token!, { title, scheduled_date: date }),
    onSuccess: () => {
      setTitle("");
      queryClient.invalidateQueries({ queryKey: ["revisions"] });
      queryClient.invalidateQueries({ queryKey: ["progress-overview"] });
    },
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => api.completeRevision(token!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["revisions"] });
      queryClient.invalidateQueries({ queryKey: ["progress-overview"] });
      queryClient.invalidateQueries({ queryKey: ["topics"] });
    },
  });

  const upcoming = revisions.filter((r) => !r.completed);
  const done = revisions.filter((r) => r.completed);

  return (
    <div className="space-y-6">
      <GlassCard className="p-4" glow>
        <h3 className="font-semibold mb-3">Schedule revision</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Session title</Label>
            <Input
              className="mt-1"
              placeholder="e.g. Revise OS Chapter 4"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <Label>Date</Label>
            <Input
              type="date"
              className="mt-1"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>
        <Button
          className="mt-3"
          size="sm"
          disabled={!title.trim() || createMutation.isPending}
          onClick={() => createMutation.mutate()}
        >
          Schedule
        </Button>
      </GlassCard>

      <div>
        <h3 className="text-sm font-medium mb-2">Upcoming</h3>
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">No upcoming revisions.</p>
        ) : (
          <div className="space-y-2">
            {upcoming.map((r) => (
              <GlassCard key={r.id} className="flex items-center justify-between p-3">
                <div>
                  <p className="font-medium text-sm">{r.title}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Calendar className="h-3 w-3" />
                    {format(parseISO(r.scheduled_date), "EEEE, MMM d")}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => completeMutation.mutate(r.id)}
                >
                  <Check className="h-3.5 w-3.5 mr-1" />
                  Done
                </Button>
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      {done.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2 text-muted-foreground">Completed</h3>
          <div className="space-y-1">
            {done.slice(0, 5).map((r) => (
              <p
                key={r.id}
                className={cn("text-sm text-muted-foreground line-through opacity-60")}
              >
                {r.title}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
