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
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Logo } from "@/components/ui/logo";

const features = [
  {
    icon: Brain,
    title: "Adaptive Tutoring",
    description: "Deep, patient explanations matched to your learning level with instant LaTeX math rendering.",
  },
  {
    icon: Code2,
    title: "Engineering Mentorship",
    description: "Idiomatic code implementations, complexity analysis, and line-by-line architecture walkthroughs.",
  },
  {
    icon: Target,
    title: "Technical Interview Prep",
    description: "Structured problem derivations, STAR-method structuring, and live interviewer feedback.",
  },
  {
    icon: Zap,
    title: "Exam Revision Hub",
    description: "High-yield checkpoints, flashcard-style rapid recall, and spaced revision scheduling.",
  },
  {
    icon: BookText,
    title: "Hybrid Knowledge RAG",
    description: "Upload PDFs and lecture notes to query your curriculum with page-accurate inline citations.",
  },
  {
    icon: Workflow,
    title: "Visual Architecture Maps",
    description: "Self-healing interactive Mermaid diagrams for distributed systems and data structures.",
  },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-background selection:bg-primary/20">
      {/* Navigation Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border/60 bg-background/80 px-6 py-4 backdrop-blur-md md:px-12">
        <Link href="/" className="transition-opacity hover:opacity-90">
          <Logo size={36} textClassName="text-base" />
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "text-xs md:text-sm font-medium",
            )}
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className={cn(
              buttonVariants({ size: "sm" }),
              "rounded-xl text-xs md:text-sm font-medium px-4",
            )}
          >
            Get started
          </Link>
        </div>
      </header>

      <main className="px-6 pb-24 md:px-12">
        {/* Hero Section */}
        <section className="mx-auto max-w-4xl pt-16 text-center md:pt-24">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="space-y-6"
          >
            {/* Center Logo Showcase */}
            <div className="mx-auto flex justify-center pb-2">
              <div className="relative p-1 rounded-2xl bg-card border border-border/80 shadow-md">
                <Logo size={72} showText={false} />
              </div>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3.5 py-1 text-xs font-medium text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              The AI workspace built for serious students
            </div>

            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl text-foreground">
              Master complex topics.
              <br />
              <span className="text-muted-foreground font-normal">
                Ace exams and engineering interviews.
              </span>
            </h1>

            <p className="mx-auto max-w-2xl text-base md:text-lg text-muted-foreground leading-relaxed">
              StudentOS integrates dynamic AI tutoring, page-accurate document RAG,
              real-time web context, and automated visual diagrams into one unified study OS.
            </p>

            <div className="pt-4 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/signup"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "h-11 px-6 rounded-xl font-medium text-sm inline-flex items-center gap-2",
                )}
              >
                Start learning now
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ size: "lg", variant: "outline" }),
                  "h-11 px-6 rounded-xl font-medium text-sm",
                )}
              >
                Sign in to workspace
              </Link>
            </div>
          </motion.div>
        </section>

        {/* Feature Grid */}
        <section className="mx-auto mt-24 max-w-5xl">
          <div className="mb-10 text-center space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Engineered for comprehension
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Everything you need to go from fundamental theory to production code and exam mastery.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                className="group rounded-2xl border border-border/80 bg-card p-5 transition-all hover:border-foreground/20 hover:shadow-xs"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-foreground">
                  <feature.icon className="h-4 w-4" />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-foreground">{feature.title}</h3>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="mx-auto mt-24 max-w-2xl text-center">
          <div className="rounded-3xl border border-border/80 bg-card p-10 space-y-4">
            <h2 className="text-2xl font-semibold text-foreground tracking-tight">
              Ready to elevate your study routine?
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Join students preparing for top university exams and high-impact software careers.
            </p>
            <div className="pt-2">
              <Link
                href="/signup"
                className={cn(buttonVariants(), "h-10 px-6 rounded-xl font-medium text-sm")}
              >
                Create free account
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} StudentOS &bull; AI Learning Workspace.
      </footer>
    </div>
  );
}
