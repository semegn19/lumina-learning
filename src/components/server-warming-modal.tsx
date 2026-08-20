import { useState, useEffect } from "react";
import { CloudLightning, Loader2, RefreshCw, RotateCcw, Server, Sparkles, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ServerWarmingModalProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  description?: string;
  onRetry?: () => void;
}

const WARMING_TIPS = [
  "Once awake, the server remains active and ultra-fast for your entire session.",
  "Your course videos, study notes, and assignments will load seamlessly.",
  "Sleep-when-idle hosting saves green energy while keeping the platform accessible.",
  "Establishing a secure encrypted connection to the API cluster...",
];

export function ServerWarmingModal({
  open,
  onOpenChange,
  title = "Waking up the server…",
  description = "Our backend is starting up from sleep mode. Free-tier cloud instances typically take 30–45 seconds to spin up on first request.",
  onRetry,
}: ServerWarmingModalProps) {
  const [elapsed, setElapsed] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    if (!open) {
      setElapsed(0);
      return;
    }

    const timer = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);

    const tipTimer = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % WARMING_TIPS.length);
    }, 4500);

    return () => {
      clearInterval(timer);
      clearInterval(tipTimer);
    };
  }, [open]);

  if (!open) return null;

  const isTakingLong = elapsed >= 50;

  // Approximate progress towards 40s (clamped at 95% until complete)
  const progressPercent = Math.min(95, Math.max(5, Math.round((elapsed / 40) * 90)));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="surface-card w-full max-w-md overflow-hidden rounded-3xl border border-border/80 p-6 sm:p-8 shadow-2xl space-y-6 text-center animate-in zoom-in-95 duration-200">
        {/* Animated Icon Header */}
        <div className="relative mx-auto flex size-20 items-center justify-center">
          <div className="absolute inset-0 animate-ping rounded-full bg-primary/20 duration-1000" />
          <div className="relative grid size-16 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <Server className="size-8 animate-pulse" aria-hidden />
          </div>
          <span className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full bg-background border-2 border-primary shadow-xs">
            <span className="size-2.5 rounded-full bg-success animate-ping" />
          </span>
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <h3 className="text-2xl font-bold tracking-tight text-foreground">{title}</h3>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>

        {/* Progress Bar & Elapsed Counter */}
        <div className="space-y-2.5 rounded-2xl bg-accent/40 p-4 border border-border/60">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-primary">
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
              <span>Connecting to backend</span>
            </span>
            <span className="font-mono text-muted-foreground">{elapsed}s elapsed</span>
          </div>

          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all duration-1000 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <p className="text-[11px] text-muted-foreground italic flex items-center justify-center gap-1 min-h-[32px]">
            <Sparkles className="size-3 text-primary shrink-0" aria-hidden />
            <span>{WARMING_TIPS[tipIndex]}</span>
          </p>
        </div>

        {/* Fallback actions if it takes too long */}
        {isTakingLong ? (
          <div className="space-y-3 pt-2">
            <p className="text-xs font-medium text-amber-500 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
              The server is taking longer than usual to wake up.
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {onRetry && (
                <Button
                  onClick={onRetry}
                  className="gap-2 rounded-xl text-xs font-semibold h-11"
                >
                  <RotateCcw className="size-3.5" aria-hidden /> Retry Now
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className={`gap-2 rounded-xl text-xs font-semibold h-11 ${!onRetry ? "col-span-2" : ""}`}
              >
                <RefreshCw className="size-3.5" aria-hidden /> Refresh Page
              </Button>
            </div>
          </div>
        ) : (
          <div className="pt-2">
            {onOpenChange && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Dismiss & wait in background
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
