"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { Calendar, Check } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import type { StudyPlan, StudyTask } from "@/types/progress";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function StudyPlanPanel() {
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();
  const [weeklyHours, setWeeklyHours] = useState(5);
  const [focus, setFocus] = useState("");

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["study-plans"],
    queryFn: () => api.listStudyPlans(token!),
    enabled: !!token,
  });

  const generateMutation = useMutation({
    mutationFn: () =>
      api.generateStudyPlan(token!, {
        weekly_hours: weeklyHours,
        focus: focus || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["study-plans"] });
    },
  });

  const completeMutation = useMutation({
    mutationFn: ({ planId, taskId }: { planId: string; taskId: string }) =>
      api.completeStudyTask(token!, planId, taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["study-plans"] });
      queryClient.invalidateQueries({ queryKey: ["progress-overview"] });
    },
  });

  const activePlan = plans.find((p) => p.status === "active") ?? plans[0];

  return (
    <div className="space-y-6">
      <GlassCard className="p-4">
        <h3 className="font-semibold">Study Planner</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Generates a weekly plan based on your weak topics and learning goal.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Hours per week</Label>
            <Input
              type="number"
              min={1}
              max={40}
              className="mt-1"
              value={weeklyHours}
              onChange={(e) => setWeeklyHours(Number(e.target.value))}
            />
          </div>
          <div>
            <Label>Focus (optional)</Label>
            <Input
              className="mt-1"
              placeholder="e.g. Final exam in 2 weeks"
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
            />
          </div>
        </div>
        <Button
          className="mt-4"
          disabled={generateMutation.isPending}
          onClick={() => generateMutation.mutate()}
        >
          {generateMutation.isPending ? "Generating..." : "Generate study plan"}
        </Button>
      </GlassCard>

      {isLoading && <p className="text-sm text-muted-foreground">Loading plans...</p>}

      {activePlan && (
        <PlanCard
          plan={activePlan}
          onCompleteTask={(taskId) =>
            completeMutation.mutate({ planId: activePlan.id, taskId })
          }
        />
      )}

      {!isLoading && plans.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No study plan yet. Generate one above.
        </p>
      )}
    </div>
  );
}

function PlanCard({
  plan,
  onCompleteTask,
}: {
  plan: StudyPlan;
  onCompleteTask: (taskId: string) => void;
}) {
  const tasks = plan.plan_data?.tasks ?? [];

  return (
    <GlassCard className="p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold">{plan.title}</h3>
          {plan.description && (
            <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
          )}
          {plan.ai_generated && (
            <span className="mt-1 inline-block text-[10px] text-muted-foreground">
              Auto-generated
            </span>
          )}
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">{plan.progress_percent}%</p>
          <p className="text-xs text-muted-foreground">complete</p>
        </div>
      </div>
      <div className="mb-4 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${plan.progress_percent}%` }}
        />
      </div>
      <div className="space-y-2">
        {tasks.map((task: StudyTask) => (
          <div
            key={task.id}
            className={cn(
              "flex items-center gap-3 rounded-lg border p-3",
              task.completed ? "border-green-500/30 bg-green-500/5" : "border-border/50",
            )}
          >
            <button
              type="button"
              onClick={() => !task.completed && onCompleteTask(task.id)}
              disabled={task.completed}
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
                task.completed
                  ? "border-green-500 bg-green-500 text-white"
                  : "hover:border-primary",
              )}
            >
              {task.completed && <Check className="h-3.5 w-3.5" />}
            </button>
            <div className="min-w-0 flex-1">
              <p className={cn("text-sm font-medium", task.completed && "line-through opacity-60")}>
                {task.title}
              </p>
              <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {format(parseISO(task.due_date), "MMM d")} | {task.duration_minutes} min |{" "}
                {task.topic}
              </p>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
