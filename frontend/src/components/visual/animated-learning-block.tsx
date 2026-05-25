"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnimatedLearningBlockProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  index?: number;
  highlight?: boolean;
  className?: string;
}

export function AnimatedLearningBlock({
  title,
  description,
  icon: Icon,
  index = 0,
  highlight = false,
  className,
}: AnimatedLearningBlockProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08, duration: 0.35 }}
      className={cn(
        "relative rounded-xl border p-4 transition-shadow",
        highlight
          ? "border-primary/50 bg-primary/10 shadow-[0_0_24px_rgba(99,102,241,0.15)]"
          : "border-border/50 bg-card/50",
        className,
      )}
    >
      {highlight && (
        <motion.span
          layoutId="highlight-pulse"
          className="absolute inset-0 rounded-xl ring-2 ring-primary/30"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
      <div className="relative flex gap-3">
        {Icon && (
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
              highlight ? "bg-primary text-primary-foreground" : "bg-muted",
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div>
          <h4 className="font-semibold text-sm">{title}</h4>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
