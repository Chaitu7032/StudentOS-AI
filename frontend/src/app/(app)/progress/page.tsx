"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  BarChart3,
  Brain,
  Calendar,
  ListTodo,
  Target,
  TrendingUp,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { TopicTracker } from "@/components/progress/topic-tracker";
import { StudyPlanPanel } from "@/components/progress/study-plan-panel";
import { RevisionScheduler } from "@/components/progress/revision-scheduler";
import { LearningMemoryPanel } from "@/components/progress/learning-memory-panel";
import { RecommendationsCard } from "@/components/progress/recommendations-card";

export default function ProgressPage() {
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();
  const [goalDraft, setGoalDraft] = useState<string | null>(null);
  const [dailyGoalDraft, setDailyGoalDraft] = useState<number | null>(null);

  const { data: overview } = useQuery({
    queryKey: ["progress-overview"],
    queryFn: () => api.getProgressOverview(token!),
    enabled: !!token,
  });

  useEffect(() => {
    if (token) {
      api.logActivity(token, { minutes: 1 }).catch(() => {});
    }
  }, [token]);

  const goal = goalDraft ?? overview?.profile?.learning_goal ?? "";
  const dailyGoal = dailyGoalDraft ?? overview?.profile?.daily_goal_minutes ?? 30;

  const profileMutation = useMutation({
    mutationFn: () =>
      api.updateProfile(token!, {
        learning_goal: goal,
        daily_goal_minutes: dailyGoal,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["progress-overview"] });
    },
  });

  const p = overview?.profile;

  return (
    <div className="h-full w-full min-w-0 overflow-y-auto">
      <div className="mesh-gradient pointer-events-none fixed inset-0 opacity-30" />
      <div className="app-shell">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-card">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                Progress & Personalization
              </h1>
              <p className="text-muted-foreground">
                Track mastery, plan studies, and build your learning memory
              </p>
            </div>
          </div>
        </motion.div>

        {overview && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  label: "Study streak",
                  value: `${p?.study_streak ?? 0} days`,
                  sub: `Best: ${p?.longest_streak ?? 0}`,
                  icon: TrendingUp,
                },
                {
                  label: "Today",
                  value: `${p?.today_minutes ?? 0}/${p?.daily_goal_minutes ?? 30} min`,
                  sub: "Daily goal",
                  icon: Target,
                },
                {
                  label: "Topics",
                  value: String(overview.topics_count),
                  sub: `${overview.weak_topics_count} weak`,
                  icon: Brain,
                },
                {
                  label: "Total study",
                  value: `${Math.round((p?.total_study_minutes ?? 0) / 60)}h`,
                  sub: `${overview.total_messages} messages`,
                  icon: BarChart3,
                },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <GlassCard className="p-4">
                    <stat.icon className="mb-2 h-4 w-4 text-primary" />
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-xl font-bold">{stat.value}</p>
                    <p className="text-[10px] text-muted-foreground">{stat.sub}</p>
                  </GlassCard>
                </motion.div>
              ))}
            </div>

            <RecommendationsCard recommendations={overview.recommendations} />

            <GlassCard className="p-4">
              <h3 className="mb-3 font-semibold">Learning profile</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Learning goal</Label>
                  <Input
                    className="mt-1"
                    placeholder="e.g. Crack FAANG interviews by December"
                    value={goal}
                    onChange={(e) => setGoalDraft(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Daily goal (minutes)</Label>
                  <Input
                    type="number"
                    min={5}
                    max={480}
                    className="mt-1"
                    value={dailyGoal}
                    onChange={(e) => setDailyGoalDraft(Number(e.target.value))}
                  />
                </div>
              </div>
              <Button
                size="sm"
                className="mt-3"
                variant="outline"
                onClick={() => profileMutation.mutate()}
                disabled={profileMutation.isPending}
              >
                Save profile
              </Button>
            </GlassCard>
          </>
        )}

        <Tabs defaultValue="topics" className="w-full">
          <TabsList className="grid h-auto w-full grid-cols-2 gap-1 sm:grid-cols-4">
            <TabsTrigger value="topics" className="text-xs sm:text-sm">
              <Target className="mr-1 hidden h-3.5 w-3.5 sm:inline" />
              Topics
            </TabsTrigger>
            <TabsTrigger value="plan" className="text-xs sm:text-sm">
              <ListTodo className="mr-1 hidden h-3.5 w-3.5 sm:inline" />
              Study Plan
            </TabsTrigger>
            <TabsTrigger value="revision" className="text-xs sm:text-sm">
              <Calendar className="mr-1 hidden h-3.5 w-3.5 sm:inline" />
              Revision
            </TabsTrigger>
            <TabsTrigger value="memory" className="text-xs sm:text-sm">
              <Brain className="mr-1 hidden h-3.5 w-3.5 sm:inline" />
              Memory
            </TabsTrigger>
          </TabsList>
          <TabsContent value="topics" className="mt-6">
            <TopicTracker />
          </TabsContent>
          <TabsContent value="plan" className="mt-6">
            <StudyPlanPanel />
          </TabsContent>
          <TabsContent value="revision" className="mt-6">
            <RevisionScheduler />
          </TabsContent>
          <TabsContent value="memory" className="mt-6">
            <LearningMemoryPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
