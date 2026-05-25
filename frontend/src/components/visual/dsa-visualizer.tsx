"use client";

import { useCallback, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";

type Algorithm = "bubble" | "binary-search";

interface SortStep {
  array: number[];
  comparing: [number, number] | null;
  sorted: number[];
  description: string;
}

function generateBubbleSortSteps(arr: number[]): SortStep[] {
  const a = [...arr];
  const steps: SortStep[] = [
    {
      array: [...a],
      comparing: null,
      sorted: [],
      description: "Starting array",
    },
  ];
  const sortedIdx = new Set<number>();

  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < a.length - i - 1; j++) {
      steps.push({
        array: [...a],
        comparing: [j, j + 1],
        sorted: [...sortedIdx],
        description: `Compare ${a[j]} and ${a[j + 1]}`,
      });
      if (a[j] > a[j + 1]) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        steps.push({
          array: [...a],
          comparing: [j, j + 1],
          sorted: [...sortedIdx],
          description: `Swap → [${a.join(", ")}]`,
        });
      }
    }
    sortedIdx.add(a.length - i - 1);
  }
  steps.push({
    array: [...a],
    comparing: null,
    sorted: Array.from({ length: a.length }, (_, i) => i),
    description: "Sorted!",
  });
  return steps;
}

function generateBinarySearchSteps(arr: number[], target: number): SortStep[] {
  const a = [...arr].sort((x, y) => x - y);
  let lo = 0;
  let hi = a.length - 1;
  const steps: SortStep[] = [
    {
      array: a,
      comparing: null,
      sorted: [],
      description: `Sorted array, searching for ${target}`,
    },
  ];

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    steps.push({
      array: a,
      comparing: [mid, mid],
      sorted: [],
      description: `Check index ${mid} (value ${a[mid]})`,
    });
    if (a[mid] === target) {
      steps.push({
        array: a,
        comparing: [mid, mid],
        sorted: [mid],
        description: `Found ${target} at index ${mid}!`,
      });
      return steps;
    }
    if (a[mid] < target) {
      lo = mid + 1;
      steps.push({
        array: a,
        comparing: null,
        sorted: [],
        description: `${target} > ${a[mid]} → search right half`,
      });
    } else {
      hi = mid - 1;
      steps.push({
        array: a,
        comparing: null,
        sorted: [],
        description: `${target} < ${a[mid]} → search left half`,
      });
    }
  }
  steps.push({
    array: a,
    comparing: null,
    sorted: [],
    description: `${target} not found`,
  });
  return steps;
}

export function DsaVisualizer() {
  const [input, setInput] = useState("64, 34, 25, 12, 22, 11, 90");
  const [target, setTarget] = useState("25");
  const [algorithm, setAlgorithm] = useState<Algorithm>("bubble");
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

  const parseArray = useCallback(() => {
    return input
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !Number.isNaN(n));
  }, [input]);

  const steps = useMemo(() => {
    const arr = parseArray();
    if (arr.length === 0) return [];
    if (algorithm === "bubble") return generateBubbleSortSteps(arr);
    return generateBinarySearchSteps(arr, parseInt(target, 10) || 0);
  }, [parseArray, algorithm, target]);

  const current = steps[stepIndex];
  const maxVal = current ? Math.max(...current.array, 1) : 1;

  const go = (delta: number) => {
    setStepIndex((i) => Math.max(0, Math.min(steps.length - 1, i + delta)));
  };

  const reset = () => {
    setStepIndex(0);
    setPlaying(false);
  };

  const play = () => {
    if (steps.length === 0) return;
    setPlaying(true);
    let i = stepIndex;
    const interval = setInterval(() => {
      i += 1;
      if (i >= steps.length) {
        clearInterval(interval);
        setPlaying(false);
        return;
      }
      setStepIndex(i);
    }, 800);
  };

  return (
    <GlassCard className="p-6" glow>
      <div className="mb-4 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={algorithm === "bubble" ? "default" : "outline"}
          onClick={() => {
            setAlgorithm("bubble");
            reset();
          }}
        >
          Bubble Sort
        </Button>
        <Button
          size="sm"
          variant={algorithm === "binary-search" ? "default" : "outline"}
          onClick={() => {
            setAlgorithm("binary-search");
            reset();
          }}
        >
          Binary Search
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-6">
        <div>
          <Label>Array (comma-separated)</Label>
          <Input
            className="mt-1.5"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              reset();
            }}
          />
        </div>
        {algorithm === "binary-search" && (
          <div>
            <Label>Target value</Label>
            <Input
              className="mt-1.5"
              value={target}
              onChange={(e) => {
                setTarget(e.target.value);
                reset();
              }}
            />
          </div>
        )}
      </div>

      {current && (
        <>
          <div className="flex items-end justify-center gap-1.5 sm:gap-2 h-48 px-2">
            <AnimatePresence mode="popLayout">
              {current.array.map((val, idx) => {
                const isComparing =
                  current.comparing &&
                  (idx === current.comparing[0] || idx === current.comparing[1]);
                const isSorted = current.sorted.includes(idx);
                return (
                  <motion.div
                    key={`${idx}-${val}`}
                    layout
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    className="flex flex-col items-center gap-1 flex-1 max-w-12"
                  >
                    <motion.div
                      animate={{
                        height: `${(val / maxVal) * 140}px`,
                        backgroundColor: isSorted
                          ? "rgb(34 197 94)"
                          : isComparing
                            ? "rgb(99 102 241)"
                            : "rgb(100 116 139)",
                      }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      className="w-full min-h-[8px] rounded-t-md origin-bottom"
                    />
                    <span
                      className={cn(
                        "text-xs font-mono font-medium",
                        isComparing && "text-primary",
                        isSorted && "text-green-500",
                      )}
                    >
                      {val}
                    </span>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          <motion.p
            key={current.description}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 text-center text-sm text-muted-foreground min-h-[1.25rem]"
          >
            {current.description}
          </motion.p>

          <div className="mt-6 flex items-center justify-center gap-2">
            <Button variant="outline" size="icon" onClick={() => go(-1)} disabled={stepIndex === 0}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={play} disabled={playing || steps.length === 0}>
              <Play className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground min-w-[80px] text-center">
              {stepIndex + 1} / {steps.length}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => go(1)}
              disabled={stepIndex >= steps.length - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={reset}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}
    </GlassCard>
  );
}
