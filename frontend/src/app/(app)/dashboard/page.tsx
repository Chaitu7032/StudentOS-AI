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
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { RecommendationsCard } from "@/components/progress/recommendations-card";

const quickActions = [
  {
    title: "Tutor Workspace",
    description: "Deep theory, DSA problem walkthroughs & KaTeX math",
    icon: Brain,
    href: "/chat",
  },
  {
    title: "Knowledge & Notes",
    description: "Upload PDFs and query course slides with citations",
    icon: BookOpen,
    href: "/knowledge",
  },
  {
    title: "Interview Sandbox",
    description: "Practice technical coding interview challenges",
    icon: Target,
    href: "/chat",
    mode: "interview",
  },
  {
    title: "Revision Queue",
    description: "Rapid recall session tailored for upcoming exams",
    icon: Zap,
    href: "/chat",
    mode: "revision",
  },
  {
    title: "Visual Architecture",
    description: "Explore interactive Mermaid flowcharts & concept diagrams",
    icon: Workflow,
    href: "/visual",
  },
  {
    title: "Analytics & Progress",
    description: "Track mastery scores, streaks, and study plans",
    icon: BarChart3,
    href: "/progress",
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
      label: "Mastered Topics",
      value: overviewLoading ? "-" : String(overview?.topics_count ?? 0),
      icon: BookOpen,
    },
    {
      label: "Conversations",
      value: chatsLoading ? "-" : String(chats?.length ?? 0),
      icon: Brain,
    },
    {
      label: "Daily Focus",
      value: overviewLoading
        ? "-"
        : `${p?.today_minutes ?? 0}/${p?.daily_goal_minutes ?? 30}m`,
      icon: GraduationCap,
    },
  ];

  return (
    <div className="h-full w-full min-w-0 overflow-y-auto bg-background">
      <div className="app-shell">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            Welcome back, {user?.full_name?.split(" ")[0] ?? "Student"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Your deliberate practice dashboard & learning statistics.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Link key={stat.label} href="/progress">
              <div className="rounded-2xl border border-border/80 bg-card p-4 transition-all hover:border-foreground/20 hover:shadow-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                    <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{stat.value}</p>
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                    <stat.icon className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Recommendations */}
        {overview && overview.recommendations.length > 0 && (
          <RecommendationsCard recommendations={overview.recommendations.slice(0, 3)} />
        )}

        {/* Quick Actions */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/80">
            Workspaces & Modes
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {quickActions.map((action) => (
              <div
                key={action.title}
                className="group cursor-pointer rounded-2xl border border-border/80 bg-card p-4 transition-all hover:border-foreground/20 hover:shadow-xs"
                onClick={() =>
                  action.href && !action.mode
                    ? router.push(action.href)
                    : startChat(action.mode)
                }
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-foreground">
                    <action.icon className="h-4 w-4" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-foreground">{action.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  {action.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Chats */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/80">
              Recent Conversations
            </h2>
            <Link
              href="/chat"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-xs text-muted-foreground")}
            >
              Open all
            </Link>
          </div>
          {chatsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((n) => (
                <Skeleton key={n} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          ) : chats && chats.length > 0 ? (
            <div className="space-y-1.5">
              {chats.slice(0, 5).map((chat) => (
                <Link key={chat.id} href={`/chat/${chat.id}`}>
                  <div className="flex items-center justify-between rounded-xl border border-border/70 bg-card p-3.5 transition-colors hover:bg-muted/50">
                    <div className="min-w-0 pr-4">
                      <p className="text-sm font-medium text-foreground truncate">{chat.title}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {chat.learning_mode.replace("_", " ")} &bull; {chat.message_count} messages
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-border/80 bg-card p-8 text-center space-y-3">
              <p className="text-xs text-muted-foreground">No conversations yet.</p>
              <Button size="sm" className="rounded-xl" onClick={() => startChat()}>
                Start your first chat
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
