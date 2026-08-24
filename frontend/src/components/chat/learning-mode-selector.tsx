"use client";

import { LEARNING_MODES, type LearningMode } from "@/types";
import { cn } from "@/lib/utils";

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
  if (compact) {
    return (
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
        {LEARNING_MODES.map((mode) => {
          const active = value === mode.id;
          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => onChange(mode.id)}
              title={mode.description}
              className={cn(
                "whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium transition-colors shrink-0",
                active
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
            >
              {mode.label}
            </button>
          );
        })}
      </div>
    );
  }

  // Landing state: horizontal pill row
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {LEARNING_MODES.map((mode) => {
        const active = value === mode.id;
        return (
          <button
            key={mode.id}
            type="button"
            onClick={() => onChange(mode.id)}
            title={mode.description}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium transition-all duration-150 shrink-0",
              active
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground",
            )}
          >
            {mode.label}
          </button>
        );
      })}
    </div>
  );
}
