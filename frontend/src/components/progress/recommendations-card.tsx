"use client";

import { motion } from "framer-motion";
import { Lightbulb } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";

export function RecommendationsCard({ recommendations }: { recommendations: string[] }) {
  if (recommendations.length === 0) return null;

  return (
    <GlassCard className="p-5">
      <h3 className="mb-3 flex items-center gap-2 font-semibold">
        <Lightbulb className="h-4 w-4 text-amber-500" />
        Recommendations
      </h3>
      <ul className="space-y-2">
        {recommendations.map((rec, i) => (
          <motion.li
            key={rec}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex gap-2 text-sm text-muted-foreground"
          >
            <span className="shrink-0 text-primary">-</span>
            {rec}
          </motion.li>
        ))}
      </ul>
    </GlassCard>
  );
}
