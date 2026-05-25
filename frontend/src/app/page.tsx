"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookText,
  Brain,
  Code2,
  GraduationCap,
  Target,
  Workflow,
  Zap,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/ui/glass-card";
import { ThemeToggle } from "@/components/layout/theme-toggle";

const features = [
  {
    icon: Brain,
    title: "Tutor Support",
    description: "Clear explanations across multiple learning modes",
  },
  {
    icon: Code2,
    title: "Coding Mentor",
    description: "Line-by-line help with practical implementation guidance",
  },
  {
    icon: Target,
    title: "Interview Prep",
    description: "Structured technical interview practice and feedback",
  },
  {
    icon: Zap,
    title: "Revision Assistant",
    description: "Fast recall sessions and exam-focused summaries",
  },
  {
    icon: GraduationCap,
    title: "Study Planning",
    description: "Weekly planning aligned with your academic goals",
  },
  {
    icon: BookText,
    title: "Knowledge Workspace",
    description: "Work directly with your notes and course material",
  },
  {
    icon: Workflow,
    title: "Visual Learning",
    description: "Diagrams, DSA walkthroughs, and concept mapping",
  },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="mesh-gradient pointer-events-none fixed inset-0 opacity-80" />

      <header className="relative z-10 flex items-center justify-between px-6 py-5 md:px-10">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card">
            <GraduationCap className="h-4 w-4 text-primary" />
          </div>
          <span className="font-semibold tracking-tight">StudentOS</span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link href="/login" className={cn(buttonVariants({ variant: "ghost" }))}>
            Sign in
          </Link>
          <Link href="/signup" className={cn(buttonVariants())}>
            Get started
          </Link>
        </div>
      </header>

      <main className="relative z-10 px-6 pb-24 md:px-10">
        <section className="mx-auto max-w-4xl pt-16 text-center md:pt-24">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm text-muted-foreground">
              Built for focused learning
            </span>
            <h1 className="mt-8 text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
              One workspace for
              <br />
              studying, coding, and career prep
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              StudentOS brings tutoring, coding mentorship, interview preparation,
              and progress tracking into a single professional learning platform.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/signup"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "h-12 px-8 text-base inline-flex items-center",
                )}
              >
                Start learning
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ size: "lg", variant: "outline" }),
                  "h-12",
                )}
              >
                Sign in
              </Link>
            </div>
          </motion.div>
        </section>

        <section className="mx-auto mt-24 max-w-6xl">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <GlassCard className="h-full p-6">
                  <feature.icon className="h-8 w-8 text-primary" />
                  <h3 className="mt-4 font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-24 max-w-3xl text-center">
          <GlassCard className="p-10">
            <h2 className="text-2xl font-bold md:text-3xl">
              Built for students. Designed for consistency.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Keep your learning flow in one place with reliable tools for daily
              practice and long-term progress.
            </p>
            <Link href="/signup" className={cn(buttonVariants(), "mt-8 inline-flex")}>
              Create account
            </Link>
          </GlassCard>
        </section>
      </main>

      <footer className="relative z-10 border-t border-border/50 py-8 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} StudentOS
      </footer>
    </div>
  );
}
