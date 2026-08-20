"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Award,
  CheckCircle,
  CheckCircle2,
  Clock,
  Coins,
  Crown,
  ExternalLink,
  Flame,
  Info,
  Lock,
  Medal,
  PartyPopper,
  Send,
  Sparkles,
  Star,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/shared/spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { useCertProgram, useCertProgress } from "@/lib/hooks";
import { formatCoins, toMillis } from "@/lib/utils";
import type { CertDay, CertDayStatus, CertProgress } from "@/types";

const dayStatusConfig: Record<
  CertDayStatus,
  { label: string; color: string; badgeVariant?: "warning" | "success" | "secondary"; icon: typeof CheckCircle }
> = {
  pending: { label: "Available", color: "text-brand-500", icon: Zap },
  reported: { label: "Under Review", color: "text-amber-500", badgeVariant: "warning", icon: Clock },
  completed: { label: "Verified ✓", color: "text-emerald-500", badgeVariant: "success", icon: CheckCircle },
};

const MILESTONES = [
  { day: 7, title: "Week 1 Sprinter", icon: Medal, reward: "+100 Coins", color: "text-amber-600" },
  { day: 14, title: "Halfway Hero", icon: Star, reward: "+250 Coins", color: "text-sky-500" },
  { day: 21, title: "Sprint Master", icon: Trophy, reward: "+500 Coins", color: "text-purple-500" },
  { day: 30, title: "Certified Legend", icon: Crown, reward: "+1,000 Coins", color: "text-amber-500" },
];

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
  const weekNumber = Math.ceil(day.day / 7);

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
      toast.success(`Day ${day.day} reported! An admin will verify your certificate soon.`);
      onReport();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setReporting(false);
    }
  };

  return (
    <motion.div
      id={`cert-day-${day.day}`}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className={`transition-all duration-300 rounded-2xl border-2 overflow-hidden ${
          isLocked
            ? "opacity-60 bg-muted/20 border-border/60"
            : status === "completed"
            ? "border-emerald-500/40 bg-emerald-500/5 shadow-sm"
            : status === "reported"
            ? "border-amber-500/40 bg-amber-500/5 shadow-sm"
            : "hover:border-brand-500/40 hover:shadow-md bg-card"
        }`}
      >
        <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5">
          {/* Left: Day Icon & Content */}
          <div className="flex items-start gap-4 min-w-0 flex-1">
            {/* Day number block */}
            <div
              className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl font-display font-bold shadow-xs transition-all ${
                status === "completed"
                  ? "bg-emerald-500 text-white shadow-emerald-500/20"
                  : status === "reported"
                  ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                  : isLocked
                  ? "bg-muted text-muted-foreground"
                  : "bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20"
              }`}
            >
              {isLocked ? (
                <Lock className="h-5 w-5" />
              ) : (
                <>
                  <span className="text-[10px] uppercase font-bold tracking-wider opacity-75">Day</span>
                  <span className="text-xl leading-none">{day.day}</span>
                </>
              )}
            </div>

            {/* Content info */}
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-mono font-bold text-muted-foreground uppercase">
                  Week {weekNumber}
                </span>
                <h3 className="font-display text-base font-bold truncate text-foreground">
                  {day.certName}
                </h3>
              </div>

              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {day.description}
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-3 pt-1">
                <a
                  href={day.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg border bg-card px-2.5 py-1 text-xs font-bold text-brand-500 hover:text-brand-600 hover:border-brand-500/40 transition-colors shadow-2xs"
                >
                  <ExternalLink className="h-3 w-3" />
                  UiPath Academy Course
                </a>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-500">
                  <Coins className="h-3.5 w-3.5" />
                  +{formatCoins(day.coins)} coins
                </span>
              </div>
            </div>
          </div>

          {/* Right: Status / Action */}
          <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
            {!isLocked && status === "pending" && (
              <Button
                size="sm"
                onClick={handleReport}
                disabled={reporting}
                className="gap-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 font-bold shadow-sm"
              >
                {reporting ? <Spinner className="text-white" /> : <Send className="h-3.5 w-3.5" />}
                {reporting ? "Reporting..." : "Report Complete"}
              </Button>
            )}
            {status === "reported" && (
              <Badge variant="warning" className="gap-1 font-bold py-1 px-3">
                <Clock className="h-3 w-3" /> Under Review
              </Badge>
            )}
            {status === "completed" && (
              <Badge variant="success" className="gap-1 font-bold py-1 px-3">
                <CheckCircle2 className="h-3.5 w-3.5" /> Verified
              </Badge>
            )}
            {isLocked && (
              <Badge variant="outline" className="gap-1 text-muted-foreground py-1 px-2.5 text-xs">
                <Lock className="h-3 w-3" /> Locked
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

  const [activeFilter, setActiveFilter] = useState<string>("all");

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

  const filteredDays = useMemo(() => {
    return days.filter((d) => {
      const st = getDayStatus(d.id);
      const locked = isDayLocked(d);

      if (activeFilter === "completed") return st === "completed";
      if (activeFilter === "reported") return st === "reported";
      if (activeFilter === "available") return !locked && st === "pending";
      if (activeFilter === "week1") return d.day >= 1 && d.day <= 7;
      if (activeFilter === "week2") return d.day >= 8 && d.day <= 14;
      if (activeFilter === "week3") return d.day >= 15 && d.day <= 21;
      if (activeFilter === "week4") return d.day >= 22;
      return true;
    });
  }, [days, activeFilter, progress]);

  const scrollToDay = (dayNum: number) => {
    const el = document.getElementById(`cert-day-${dayNum}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <div className="pb-24">
      {/* ── Hero Section ──────────────────────────────────────────────── */}
      <section className="hero-glow relative overflow-hidden py-20">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-20" />
        <div className="container relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl text-center"
          >
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-xs font-bold text-brand-600 dark:text-brand-400">
              <Award className="h-4 w-4" />
              30-Day Certification Sprint
            </div>
            <h1 className="font-display text-4xl font-extrabold sm:text-5xl tracking-tight">
              30 Days of <span className="text-gradient">UiPath Mastery</span>
            </h1>
            <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
              Complete one UiPath certification daily, build an unstoppable streak, and earn milestone rewards.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container max-w-4xl py-8 space-y-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Spinner className="h-9 w-9 text-uipath-orange" />
            <p className="text-sm font-semibold text-muted-foreground animate-pulse">
              Loading 30-day certification sprint...
            </p>
          </div>
        ) : days.length === 0 ? (
          <EmptyState
            icon={Award}
            title="Certification program not started yet"
            description="The 30-day certification program schedule will appear here when configured by the club team."
          />
        ) : (
          <>
            {/* ── Overall Progress & Milestone Meter ────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-3xl border-2 bg-card p-6 sm:p-8 shadow-xl space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <Badge className="bg-brand-500/10 text-brand-600 dark:text-brand-400 border-brand-500/20 mb-2 font-bold">
                    Sprint Progress
                  </Badge>
                  <h2 className="font-display text-2xl sm:text-3xl font-extrabold flex items-baseline gap-2">
                    <span>{completedCount}</span>
                    <span className="text-lg font-normal text-muted-foreground">/ {days.length} Days Verified</span>
                  </h2>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-500 to-uipath-orange text-white shadow-lg shadow-brand-500/20">
                    <Trophy className="h-7 w-7" />
                  </div>
                </div>
              </div>

              {/* Progress Bar with Milestone Markers */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between text-xs font-bold text-muted-foreground">
                  <span>{Math.round(progressPct)}% Complete</span>
                  <span>{days.length - completedCount} Days Remaining</span>
                </div>
                <Progress value={progressPct} className="h-3 rounded-full" />

                {/* Milestone Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                  {MILESTONES.map((m) => {
                    const isReached = completedCount >= m.day;
                    const Icon = m.icon;
                    return (
                      <div
                        key={m.day}
                        className={`rounded-2xl border p-3 text-center transition-all ${
                          isReached
                            ? "border-emerald-500/40 bg-emerald-500/10 font-bold"
                            : "bg-muted/30 opacity-70"
                        }`}
                      >
                        <div className="flex items-center justify-center gap-1.5 mb-1">
                          <Icon className={`h-4 w-4 ${isReached ? m.color : "text-muted-foreground"}`} />
                          <span className="font-mono text-xs font-bold">Day {m.day}</span>
                        </div>
                        <p className="text-[11px] font-semibold truncate">{m.title}</p>
                        <span className="text-[10px] font-mono text-amber-500">{m.reward}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>

            {/* ── 30-Day Interactive Mini Matrix ────────────────────────────── */}
            <Card className="p-6 border-2 rounded-3xl shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h3 className="font-display text-base font-bold flex items-center gap-2">
                    <Target className="h-4 w-4 text-brand-500" /> 30-Day Tracker Grid
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Click any day node to jump directly to its lesson card
                  </p>
                </div>
                <Badge variant="outline" className="text-xs font-bold">
                  {days.length} Days Total
                </Badge>
              </div>

              <div className="grid grid-cols-6 sm:grid-cols-10 gap-2">
                {days.map((day) => {
                  const st = getDayStatus(day.id);
                  const locked = isDayLocked(day);

                  return (
                    <button
                      key={day.id}
                      type="button"
                      onClick={() => scrollToDay(day.day)}
                      title={`Day ${day.day}: ${day.certName} (${st})`}
                      className={`flex h-10 w-full flex-col items-center justify-center rounded-xl font-mono text-xs font-bold transition-all hover:scale-105 active:scale-95 ${
                        st === "completed"
                          ? "bg-emerald-500 text-white shadow-xs shadow-emerald-500/30"
                          : st === "reported"
                          ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40"
                          : locked
                          ? "bg-muted text-muted-foreground/50 border cursor-not-allowed"
                          : "border-2 border-brand-500/40 bg-brand-500/10 text-brand-600 dark:text-brand-400 hover:bg-brand-500/20"
                      }`}
                    >
                      {locked ? <Lock className="h-3 w-3" /> : day.day}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap gap-4 text-xs font-medium text-muted-foreground border-t pt-3">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Completed ({completedCount})
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> In Review
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-brand-500" /> Available
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" /> Locked
                </span>
              </div>
            </Card>

            {/* ── Filter Tabs Bar ────────────────────────────────────────────── */}
            <div className="flex flex-wrap items-center gap-1.5 border-b pb-4">
              <button
                type="button"
                onClick={() => setActiveFilter("all")}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                  activeFilter === "all"
                    ? "bg-brand-500 text-white shadow-md"
                    : "border bg-card hover:bg-accent text-muted-foreground"
                }`}
              >
                All Days ({days.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter("available")}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                  activeFilter === "available"
                    ? "bg-brand-500 text-white shadow-md"
                    : "border bg-card hover:bg-accent text-muted-foreground"
                }`}
              >
                Available
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter("reported")}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                  activeFilter === "reported"
                    ? "bg-amber-600 text-white shadow-md"
                    : "border bg-card hover:bg-accent text-muted-foreground"
                }`}
              >
                In Review
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter("completed")}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                  activeFilter === "completed"
                    ? "bg-emerald-600 text-white shadow-md"
                    : "border bg-card hover:bg-accent text-muted-foreground"
                }`}
              >
                Completed ({completedCount})
              </button>

              <div className="h-4 w-px bg-border mx-1 hidden sm:block" />

              <button
                type="button"
                onClick={() => setActiveFilter("week1")}
                className={`rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all ${
                  activeFilter === "week1"
                    ? "bg-foreground text-background shadow-md"
                    : "border bg-card hover:bg-accent text-muted-foreground"
                }`}
              >
                Week 1
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter("week2")}
                className={`rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all ${
                  activeFilter === "week2"
                    ? "bg-foreground text-background shadow-md"
                    : "border bg-card hover:bg-accent text-muted-foreground"
                }`}
              >
                Week 2
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter("week3")}
                className={`rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all ${
                  activeFilter === "week3"
                    ? "bg-foreground text-background shadow-md"
                    : "border bg-card hover:bg-accent text-muted-foreground"
                }`}
              >
                Week 3
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter("week4")}
                className={`rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all ${
                  activeFilter === "week4"
                    ? "bg-foreground text-background shadow-md"
                    : "border bg-card hover:bg-accent text-muted-foreground"
                }`}
              >
                Week 4+
              </button>
            </div>

            {/* ── Day Cards List ─────────────────────────────────────────────── */}
            <div className="space-y-3.5">
              {filteredDays.map((day) => (
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

