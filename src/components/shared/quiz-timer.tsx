"use client";

import { useEffect, useState, memo } from "react";
import { Clock } from "lucide-react";
import { formatDuration } from "@/lib/utils";

interface QuizTimerProps {
  deadlineAt: number;
  onExpire: () => void;
}

export const QuizTimer = memo(function QuizTimer({
  deadlineAt,
  onExpire,
}: QuizTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(() =>
    Math.max(0, Math.ceil((deadlineAt - Date.now()) / 1000))
  );

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.ceil((deadlineAt - Date.now()) / 1000)
      );
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        onExpire();
      }
    }, 500);

    return () => clearInterval(timer);
  }, [deadlineAt, onExpire]);

  const isUrgent = timeLeft <= 30;
  const isCritical = timeLeft <= 15;

  const timerColor = isCritical
    ? "text-red-500 font-extrabold animate-pulse"
    : isUrgent
    ? "text-amber-500 font-bold"
    : "text-brand-500 font-semibold";

  return (
    <div
      className={`flex items-center gap-1.5 font-mono text-base sm:text-lg px-3 py-1 rounded-xl border transition-colors ${
        isUrgent
          ? "border-red-500/40 bg-red-500/10 " + timerColor
          : "border-border bg-muted/40 " + timerColor
      }`}
      aria-label={`Time remaining: ${formatDuration(timeLeft)}`}
    >
      <Clock className="h-4 w-4 shrink-0" />
      <span>{formatDuration(timeLeft)}</span>
    </div>
  );
});
