import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
}

export function GlassCard({
  className,
  glow = false,
  children,
  ...props
}: GlassCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/70 bg-card/90 shadow-sm",
        "supports-[backdrop-filter]:bg-card/80 supports-[backdrop-filter]:backdrop-blur",
        glow && "shadow-md shadow-slate-900/5 dark:shadow-black/20",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
