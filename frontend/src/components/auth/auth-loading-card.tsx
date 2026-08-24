"use client";

import { Loader2 } from "lucide-react";

interface AuthLoadingCardProps {
  title: string;
  description: string;
}

export function AuthLoadingCard({
  title,
  description,
}: AuthLoadingCardProps) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/90 p-4 text-left shadow-lg backdrop-blur">
      <div className="flex items-start gap-3">
        <Loader2 className="mt-0.5 h-5 w-5 animate-spin text-primary" />
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
}
