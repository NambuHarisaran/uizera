"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import {
  Calendar,
  Clock,
  Coins,
  Compass,
  Filter,
  Flame,
  HelpCircle,
  Radio,
  Search,
  Sparkles,
  Trophy,
  X,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/shared/empty-state";
import { useQuizzes } from "@/lib/hooks";
import { formatCoins, formatDuration, toDate } from "@/lib/utils";
import type { Quiz, QuizStatus } from "@/types";

const statusConfig: Record<QuizStatus, { label: string; variant?: "success" | "secondary" | "outline" | "default"; color?: string }> = {
  draft: { label: "Draft", color: "bg-gray-500/10 text-gray-600 dark:text-gray-400" },
  scheduled: { label: "Upcoming", color: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20" },
  live: { label: "Live Now", variant: "success" },
  closed: { label: "Completed", color: "bg-muted text-muted-foreground" },
};

function getQuizDifficulty(totalPoints: number, durationSeconds: number) {
  if (totalPoints <= 40 || durationSeconds <= 300) {
    return {
      label: "Beginner",
      badgeClass: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      dotClass: "bg-emerald-500",
    };
  }
  if (totalPoints <= 90 || durationSeconds <= 900) {
    return {
      label: "Intermediate",
      badgeClass: "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400",
      dotClass: "bg-sky-500",
    };
  }
  return {
    label: "Advanced",
    badgeClass: "border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400",
    dotClass: "bg-purple-500",
  };
}

// ── Skeleton card ─────────────────────────────────────────────────────────────
function QuizCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border bg-card overflow-hidden">
      <div className="aspect-[16/9] bg-muted" />
      <div className="p-6 space-y-3">
        <div className="flex gap-2">
          <div className="h-5 w-20 bg-muted rounded-full" />
          <div className="h-5 w-16 bg-muted rounded-full" />
        </div>
        <div className="h-6 w-3/4 bg-muted rounded-lg" />
        <div className="h-4 w-full bg-muted rounded-lg" />
        <div className="h-4 w-2/3 bg-muted rounded-lg" />
        <div className="mt-4 flex gap-2">
          <div className="h-6 w-24 bg-muted rounded-full" />
          <div className="h-6 w-20 bg-muted rounded-full" />
        </div>
        <div className="mt-4 h-10 w-full bg-muted rounded-xl" />
      </div>
    </div>
  );
}

// ── Quiz card ─────────────────────────────────────────────────────────────────
function QuizCard({ quiz }: { quiz: Quiz }) {
  const config = statusConfig[quiz.status];
  const startDate = toDate(quiz.startAt);
  const isPlayable = quiz.status === "live" || quiz.status === "scheduled";
  const diff = getQuizDifficulty(quiz.totalPoints, quiz.durationSeconds);
  const potentialCoins = quiz.totalPoints * quiz.coinsPerPoint;
  const potentialXp = quiz.xpReward ?? Math.round(quiz.totalPoints * 1.5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35 }}
      className="group flex flex-col rounded-2xl border bg-card overflow-hidden transition-all duration-300 hover:border-brand-500/40 hover:shadow-xl hover:shadow-brand-500/5 hover:-translate-y-1"
    >
      {/* Cover Image Header or Rich Gradient Pattern */}
      <div className="relative aspect-[16/9] overflow-hidden bg-muted">
        {quiz.coverImage ? (
          <Image
            src={quiz.coverImage}
            alt={quiz.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-brand-500/15 via-uipath-orange/10 to-purple-600/10 flex items-center justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-card/80 border shadow-sm backdrop-blur-md">
              {quiz.mode === "live" ? (
                <Radio className="h-7 w-7 text-uipath-orange animate-pulse" />
              ) : (
                <Zap className="h-7 w-7 text-brand-500" />
              )}
            </div>
          </div>
        )}

        {/* Top Badges Overlay */}
        <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-1.5">
            <Badge variant={config.variant} className={`${config.color} shadow-sm backdrop-blur-md`}>
              {config.label}
            </Badge>
            {quiz.status === "live" && (
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
            )}
          </div>

          <Badge variant="outline" className={`${diff.badgeClass} shadow-sm backdrop-blur-md`}>
            <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${diff.dotClass}`} />
            {diff.label}
          </Badge>
        </div>

        {/* Mode pill bottom right of cover */}
        <div className="absolute bottom-2.5 right-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur-md">
            {quiz.mode === "live" ? (
              <>
                <Radio className="h-3 w-3 text-uipath-orange" /> Live Stage
              </>
            ) : (
              <>
                <Zap className="h-3 w-3 text-brand-400" /> Self-Paced
              </>
            )}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="flex flex-1 flex-col p-6">
        <h3 className="mb-2 line-clamp-2 font-display text-lg font-bold group-hover:text-brand-500 transition-colors">
          {quiz.title}
        </h3>
        {quiz.description && (
          <p className="mb-4 line-clamp-2 text-sm text-muted-foreground leading-relaxed">
            {quiz.description}
          </p>
        )}

        {/* Reward Preview Pills */}
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
            <Coins className="h-3.5 w-3.5" /> +{formatCoins(potentialCoins)} Coins
          </span>
          <span className="inline-flex items-center gap-1 rounded-lg border border-purple-500/30 bg-purple-500/10 px-2.5 py-1 text-xs font-bold text-purple-600 dark:text-purple-400">
            <Sparkles className="h-3.5 w-3.5" /> +{potentialXp} XP
          </span>
        </div>

        {/* Meta Details */}
        <div className="mt-auto space-y-2 border-t pt-4 text-xs font-medium text-muted-foreground">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <HelpCircle className="h-3.5 w-3.5 text-brand-500" />
              {quiz.questionCount} Questions
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-brand-500" />
              {formatDuration(quiz.durationSeconds)}
            </span>
          </div>

          {startDate && (
            <div className="flex items-center gap-1.5 truncate pt-0.5">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{format(startDate, "PPp")}</span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="mt-5">
          {isPlayable ? (
            quiz.mode !== "live" ? (
              <Button asChild className="w-full gap-2 bg-brand-500 hover:bg-brand-600 font-semibold shadow-md">
                <Link href={`/quiz/${quiz.id}`}>
                  <Zap className="h-4 w-4" /> Start Standard Quiz
                </Link>
              </Button>
            ) : (
              <Button
                asChild
                className="w-full gap-2 bg-uipath-orange hover:bg-uipath-orange/90 text-white font-bold shadow-md shadow-uipath-orange/20"
              >
                <Link href={`/quiz/${quiz.id}/live`}>
                  <Radio className="h-4 w-4 animate-pulse" /> Enter Live Stage
                </Link>
              </Button>
            )
          ) : (
            <Button asChild variant="outline" className="w-full gap-2 font-medium">
              <Link href={`/quiz/${quiz.id}`}>
                <Trophy className="h-4 w-4 text-amber-500" /> View Quiz Details
              </Link>
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function QuizListContent() {
  const { data, isLoading } = useQuizzes();
  const quizzes = (data?.quizzes ?? []) as Quiz[];

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "live" | "scheduled" | "closed">("all");

  const filteredQuizzes = useMemo(() => {
    return quizzes.filter((q) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (q.description && q.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === "all" || q.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [quizzes, searchQuery, statusFilter]);

  const live = useMemo(() => filteredQuizzes.filter((q) => q.status === "live"), [filteredQuizzes]);
  const scheduled = useMemo(() => filteredQuizzes.filter((q) => q.status === "scheduled"), [filteredQuizzes]);
  const closed = useMemo(() => filteredQuizzes.filter((q) => q.status === "closed"), [filteredQuizzes]);

  // Overall counts across raw quizzes
  const totalLiveCount = quizzes.filter((q) => q.status === "live").length;
  const totalUpcomingCount = quizzes.filter((q) => q.status === "scheduled").length;
  const totalClosedCount = quizzes.filter((q) => q.status === "closed").length;
  const totalPoolCoins = quizzes
    .filter((q) => q.status === "live" || q.status === "scheduled")
    .reduce((acc, q) => acc + q.totalPoints * q.coinsPerPoint, 0);

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
              <Zap className="h-4 w-4" />
              Gamified Knowledge Arena
            </div>
            <h1 className="font-display text-4xl font-extrabold sm:text-5xl tracking-tight">
              Test Your <span className="text-gradient">UiPath Skills</span>
            </h1>
            <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
              Take timed quizzes, compete on real-time stage leaderboards, and rack up coins and XP for your profile.
            </p>

            {/* Quick Stats Strip */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm font-semibold">
              <div className="flex items-center gap-2 rounded-full border bg-card/60 px-4 py-1.5 backdrop-blur-md shadow-sm">
                <Flame className="h-4 w-4 text-uipath-orange" />
                <span>{totalLiveCount + totalUpcomingCount} Active Quizzes</span>
              </div>
              <div className="flex items-center gap-2 rounded-full border bg-card/60 px-4 py-1.5 backdrop-blur-md shadow-sm">
                <Coins className="h-4 w-4 text-amber-500" />
                <span>{formatCoins(totalPoolCoins)} Coins Reward Pool</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Filters & Search Control Bar ───────────────────────────────── */}
      <div className="container py-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-6">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold transition-all ${
                statusFilter === "all"
                  ? "bg-brand-500 text-white shadow-md shadow-brand-500/20"
                  : "border bg-card hover:bg-accent text-muted-foreground"
              }`}
            >
              All Quizzes
              <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-bold">
                {quizzes.length}
              </Badge>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("live")}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold transition-all ${
                statusFilter === "live"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                  : "border bg-card hover:bg-accent text-muted-foreground"
              }`}
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Live Stage
              {totalLiveCount > 0 && (
                <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-1.5 py-0 text-[10px]">
                  {totalLiveCount}
                </Badge>
              )}
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("scheduled")}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold transition-all ${
                statusFilter === "scheduled"
                  ? "bg-sky-600 text-white shadow-md shadow-sky-600/20"
                  : "border bg-card hover:bg-accent text-muted-foreground"
              }`}
            >
              Upcoming
              {totalUpcomingCount > 0 && (
                <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                  {totalUpcomingCount}
                </Badge>
              )}
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("closed")}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold transition-all ${
                statusFilter === "closed"
                  ? "bg-foreground text-background shadow-md"
                  : "border bg-card hover:bg-accent text-muted-foreground"
              }`}
            >
              Completed
              {totalClosedCount > 0 && (
                <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                  {totalClosedCount}
                </Badge>
              )}
            </button>
          </div>

          {/* Search Bar with Clear Button */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search quizzes by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8 h-10 rounded-xl"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* ── Quiz Cards Grid ────────────────────────────────────────────── */}
        <div className="mt-8">
          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <QuizCardSkeleton key={i} />
              ))}
            </div>
          ) : quizzes.length === 0 ? (
            <EmptyState
              icon={Zap}
              title="No quizzes available"
              description="New quizzes and live challenges will appear here when published. In the meantime, explore weekly challenges or certification sprints!"
              action={
                <div className="flex flex-wrap gap-3 justify-center">
                  <Button asChild variant="outline">
                    <Link href="/challenges">Explore Challenges</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/certifications">Certification Sprint</Link>
                  </Button>
                </div>
              }
            />
          ) : filteredQuizzes.length === 0 ? (
            <div className="py-16 text-center space-y-4 rounded-2xl border border-dashed p-8 bg-card/50">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <Search className="h-6 w-6" />
              </div>
              <h3 className="font-display text-lg font-bold">No quizzes match your filter</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                No results found for &ldquo;{searchQuery}&rdquo;. Try adjusting your search term or filter settings.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                }}
                className="gap-2"
              >
                <X className="h-3.5 w-3.5" /> Reset Filters
              </Button>
            </div>
          ) : statusFilter !== "all" ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredQuizzes.map((q) => (
                <QuizCard key={q.id} quiz={q} />
              ))}
            </div>
          ) : (
            <div className="space-y-14">
              {live.length > 0 && (
                <section>
                  <div className="mb-6 flex items-center justify-between">
                    <h2 className="flex items-center gap-2 font-display text-2xl font-bold">
                      <span className="relative flex h-3 w-3">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
                      </span>
                      Live Stage Quizzes
                    </h2>
                    <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                      {live.length} Active Now
                    </Badge>
                  </div>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {live.map((q) => (
                      <QuizCard key={q.id} quiz={q} />
                    ))}
                  </div>
                </section>
              )}

              {scheduled.length > 0 && (
                <section>
                  <div className="mb-6 flex items-center justify-between">
                    <h2 className="font-display text-2xl font-bold flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-sky-500" />
                      Upcoming Quizzes
                    </h2>
                    <Badge variant="outline">{scheduled.length} Scheduled</Badge>
                  </div>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {scheduled.map((q) => (
                      <QuizCard key={q.id} quiz={q} />
                    ))}
                  </div>
                </section>
              )}

              {closed.length > 0 && (
                <section>
                  <div className="mb-6 flex items-center justify-between">
                    <h2 className="font-display text-2xl font-bold flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-amber-500" />
                      Completed Quizzes
                    </h2>
                    <Badge variant="secondary">{closed.length} Archived</Badge>
                  </div>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {closed.map((q) => (
                      <QuizCard key={q.id} quiz={q} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

