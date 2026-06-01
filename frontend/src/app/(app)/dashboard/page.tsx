"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Brain,
  GraduationCap,
  Target,
  TrendingUp,
  Workflow,
  Zap,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { GlassCard } from "@/components/ui/glass-card";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { RecommendationsCard } from "@/components/progress/recommendations-card";

const quickActions = [
  {
    title: "Open Tutor",
    description: "Ask concepts, code, and DSA questions",
    icon: Brain,
    href: "/chat",
    tone: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  },
  {
    title: "Progress Hub",
    description: "Track topics, plans, and revision",
    icon: BarChart3,
    href: "/progress",
    tone: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  },
  {
    title: "Interview Prep",
    description: "Practice technical interview sessions",
    icon: Target,
    href: "/chat",
    mode: "interview",
    tone: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
  },
  {
    title: "Revision Mode",
    description: "Run quick recall sessions before exams",
    icon: Zap,
    href: "/chat",
    mode: "revision",
    tone: "bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300",
  },
  {
    title: "Knowledge Base",
    description: "Upload notes for contextual answers",
    icon: BookOpen,
    href: "/knowledge",
    tone: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300",
  },
  {
    title: "Visual Learning",
    description: "Use diagrams, DSA lab, and concept maps",
    icon: Workflow,
    href: "/visual",
    tone: "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300",
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const { token, user } = useAuthStore();

  const { data: chats, isLoading: chatsLoading } = useQuery({
    queryKey: ["chats"],
    queryFn: () => api.listChats(token!),
    enabled: !!token,
  });

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ["progress-overview"],
    queryFn: () => api.getProgressOverview(token!),
    enabled: !!token,
  });

  const startChat = async (mode?: string) => {
    if (!token) return;
    const chat = await api.createChat(token, {
      learning_mode: mode as "beginner" | undefined,
    });
    router.push(`/chat/${chat.id}`);
  };

  const p = overview?.profile;

  const stats = [
    {
      label: "Study Streak",
      value: overviewLoading ? "-" : `${p?.study_streak ?? 0}d`,
      icon: TrendingUp,
    },
    {
      label: "Topics",
      value: overviewLoading ? "-" : String(overview?.topics_count ?? 0),
      icon: BookOpen,
    },
    {
      label: "Chats",
      value: chatsLoading ? "-" : String(chats?.length ?? 0),
      icon: Brain,
    },
    {
      label: "Today",
      value: overviewLoading
        ? "-"
        : `${p?.today_minutes ?? 0}/${p?.daily_goal_minutes ?? 30}m`,
      icon: GraduationCap,
    },
  ];

  return (
    <div className="h-full w-full min-w-0 overflow-y-auto">
      <div className="mesh-gradient pointer-events-none fixed inset-0 opacity-30" />
      <div className="app-shell">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Welcome back, {user?.full_name?.split(" ")[0] ?? "Student"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            Continue your learning sessions and keep your progress on track.
          </p>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link href="/progress">
                <GlassCard className="p-4 transition-colors hover:bg-muted/60">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                      <p className="mt-1 text-2xl font-bold">{stat.value}</p>
                    </div>
                    <stat.icon className="h-5 w-5 text-primary/70" />
                  </div>
                </GlassCard>
              </Link>
            </motion.div>
          ))}
        </div>

        {overview && overview.recommendations.length > 0 && (
          <RecommendationsCard recommendations={overview.recommendations.slice(0, 3)} />
        )}

        <div>
          <h2 className="mb-4 text-lg font-semibold">Quick Actions</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {quickActions.map((action, i) => (
              <motion.div
                key={action.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
              >
                <GlassCard
                  className="group cursor-pointer p-5 transition-colors hover:bg-muted/60"
                  onClick={() =>
                    action.href && !action.mode
                      ? router.push(action.href)
                      : startChat(action.mode)
                  }
                >
                  <div className={cn("mb-3 inline-flex rounded-xl p-2.5", action.tone)}>
                    <action.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold">{action.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {action.description}
                  </p>
                  <ArrowRight className="mt-3 h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Chats</h2>
            <Link
              href="/chat"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              View all
            </Link>
          </div>
          {chatsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((n) => (
                <Skeleton key={n} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          ) : chats && chats.length > 0 ? (
            <div className="space-y-2">
              {chats.slice(0, 5).map((chat) => (
                <Link key={chat.id} href={`/chat/${chat.id}`}>
                  <GlassCard className="flex items-center justify-between p-4 transition-colors hover:bg-muted/60">
                    <div>
                      <p className="font-medium">{chat.title}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {chat.learning_mode.replace("_", " ")} | {chat.message_count}{" "}
                        messages
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </GlassCard>
                </Link>
              ))}
            </div>
          ) : (
            <GlassCard className="p-8 text-center">
              <p className="text-muted-foreground">No chats yet.</p>
              <Button className="mt-4" onClick={() => startChat()}>
                Start your first session
              </Button>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
}
