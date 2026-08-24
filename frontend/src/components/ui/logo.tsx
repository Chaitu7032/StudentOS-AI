"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  textClassName?: string;
}

export function Logo({
  className,
  size = 32,
  showText = true,
  textClassName,
}: LogoProps) {
  return (
    <div className={cn("inline-flex items-center gap-2.5 select-none", className)}>
      <div
        className="relative overflow-hidden rounded-xl bg-background shadow-xs ring-1 ring-border/80"
        style={{ width: size, height: size }}
      >
        <Image
          src="/logo.png"
          alt="StudentOS Logo"
          fill
          sizes={`${size}px`}
          priority
          className="object-cover object-center"
        />
      </div>
      {showText && (
        <div className="flex flex-col leading-tight">
          <span className={cn("font-semibold tracking-tight text-foreground", textClassName)}>
            StudentOS
          </span>
          <span className="text-[10px] text-muted-foreground font-medium">
            AI Workspace
          </span>
        </div>
      )}
    </div>
  );
}
