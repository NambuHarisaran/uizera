"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Award,
  CheckCircle,
  Clock,
  Coins,
  ExternalLink,
  Lock,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/shared/spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { SectionHeading } from "@/components/shared/section-heading";
import { useCertProgram, useCertProgress } from "@/lib/hooks";
import { formatCoins, toMillis } from "@/lib/utils";
import type { CertDay, CertDayStatus, CertProgress } from "@/types";

const dayStatusConfig: Record<CertDayStatus, { label: string; color: string; icon: typeof CheckCircle }> = {
  pending: { label: "Not Started", color: "text-muted-foreground", icon: Clock },
  reported: { label: "Reported", color: "text-amber-500", icon: Send },
  completed: { label: "Verified ✓", color: "text-emerald-500", icon: CheckCircle },
};

function DayCard({
  day,
  status,
  isLocked,
  onReport,
}: {
  day: CertDay;
  status: CertDayStatus;
  isLocked: boolean;
  onReport: () => void;
}) {
  const [reporting, setReporting] = useState(false);
  const config = dayStatusConfig[status];
  const StatusIcon = config.icon;

  const handleReport = async () => {
    setReporting(true);
    try {
      const res = await fetch("/api/certifications/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dayId: day.id }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error((body as { error?: string })?.error ?? "Failed to report.");
      }
      toast.success("Completion reported! An admin will verify it soon.");
      onReport();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setReporting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className={`transition-all duration-300 ${
          isLocked
            ? "opacity-50"
            : status === "completed"
              ? "border-emerald-500/30 bg-emerald-500/5"
              : status === "reported"
                ? "border-amber-500/30"
                : "hover:border-brand-500/30"
        }`}
      >
        <CardContent className="flex items-start gap-4 p-5">
          {/* Day number */}
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-display text-lg font-bold ${
              status === "completed"
                ? "bg-emerald-500 text-white"
                : status === "reported"
                  ? "bg-amber-500/20 text-amber-500"
                  : isLocked
                    ? "bg-muted text-muted-foreground"
                    : "bg-brand-500/10 text-brand-500"
            }`}
          >
            {isLocked ? <Lock className="h-5 w-5" /> : day.day}
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-display text-sm font-semibold truncate">{day.certName}</h3>
              <StatusIcon className={`h-4 w-4 shrink-0 ${config.color}`} />
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{day.description}</p>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <a
                href={day.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs font-medium text-brand-500 hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                Course Link
              </a>
              <span className="flex items-center gap-1 text-xs text-amber-500">
                <Coins className="h-3 w-3" />
                {formatCoins(day.coins)} coins
              </span>
            </div>
          </div>

          {/* Action */}
          <div className="shrink-0">
            {!isLocked && status === "pending" && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleReport}
                disabled={reporting}
                className="gap-1.5"
              >
                {reporting ? <Spinner /> : <Send className="h-3.5 w-3.5" />}
                Report
              </Button>
            )}
            {status === "reported" && (
              <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400">
                Awaiting Verification
              </Badge>
            )}
            {status === "completed" && (
              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="mr-1 h-3 w-3" />
                Done
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function CertificationsContent() {
  const { data: certData, isLoading: loadingDays } = useCertProgram();
  const { data: progressData, isLoading: loadingProgress, refetch } = useCertProgress();

  const days = (certData?.days ?? []) as CertDay[];
  const progress = (progressData?.progress ?? null) as CertProgress | null;
  const completedCount = progress?.completedCount ?? 0;
  const progressPct = days.length > 0 ? (completedCount / days.length) * 100 : 0;

  const isLoading = loadingDays || loadingProgress;

  function getDayStatus(dayId: string): CertDayStatus {
    return progress?.days?.[dayId]?.status ?? "pending";
  }

  function isDayLocked(day: CertDay): boolean {
    const unlockMs = toMillis(day.unlockDate);
    return unlockMs > 0 && Date.now() < unlockMs;
  }

  return (
    <div className="pb-24">
      <section className="hero-glow relative overflow-hidden py-24">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-20" />
        <div className="container relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl text-center"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-sm font-medium text-brand-600 dark:text-brand-400">
              <Award className="h-4 w-4" />
              30-Day Program
            </div>
            <h1 className="font-display text-4xl font-bold sm:text-5xl">
              Certification <span className="text-gradient">Sprint</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Complete one UiPath certification every day for 30 days. Track your streak and earn coins.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container max-w-3xl py-16">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner className="h-8 w-8" />
          </div>
        ) : days.length === 0 ? (
          <EmptyState
            icon={Award}
            title="Program not started yet"
            description="The 30-day certification program days will appear here when admins configure them."
          />
        ) : (
          <>
            {/* Progress overview */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-10 rounded-2xl border bg-card p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Your Progress</p>
                  <p className="font-display text-3xl font-bold">
                    {completedCount}
                    <span className="text-lg text-muted-foreground"> / {days.length}</span>
                  </p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-uipath-orange text-white shadow-lg">
                  <Award className="h-7 w-7" />
                </div>
              </div>
              <div className="mt-4">
                <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                  <span>{Math.round(progressPct)}% complete</span>
                  <span>{days.length - completedCount} remaining</span>
                </div>
                <Progress value={progressPct} className="h-3" />
              </div>
            </motion.div>

            {/* Day cards */}
            <div className="space-y-3">
              {days.map((day) => (
                <DayCard
                  key={day.id}
                  day={day}
                  status={getDayStatus(day.id)}
                  isLocked={isDayLocked(day)}
                  onReport={() => void refetch()}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
