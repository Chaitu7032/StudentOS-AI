"use client";

import { LEARNING_MODES, type LearningMode } from "@/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface LearningModeSelectorProps {
  value: LearningMode;
  onChange: (mode: LearningMode) => void;
  compact?: boolean;
}

export function LearningModeSelector({
  value,
  onChange,
  compact = false,
}: LearningModeSelectorProps) {
  return (
    <div
      className={cn(
        "flex gap-2",
        compact
          ? "flex-wrap"
          : "grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6",
      )}
    >
      {LEARNING_MODES.map((mode) => (
        <button
          key={mode.id}
          type="button"
          onClick={() => onChange(mode.id)}
          className={cn(
            "group rounded-xl border px-3 py-2 text-left transition-all duration-200",
            "hover:border-primary/50 hover:bg-primary/5",
            value === mode.id
              ? "border-primary bg-primary/10 shadow-[0_0_20px_rgba(99,102,241,0.2)]"
              : "border-border/50 bg-card/50",
            compact && "flex items-center gap-2 px-2.5 py-1.5",
          )}
        >
          <span className="text-lg">{mode.icon}</span>
          {!compact && (
            <>
              <p className="mt-1 text-sm font-medium">{mode.label}</p>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {mode.description}
              </p>
            </>
          )}
          {compact && (
            <Badge variant={value === mode.id ? "default" : "secondary"} className="text-xs">
              {mode.label}
            </Badge>
          )}
        </button>
      ))}
    </div>
  );
}
