"use client";

import { use, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Award,
  BookOpen,
  CheckCircle2,
  Coins,
  Copy,
  PartyPopper,
  RefreshCw,
  Share2,
  Sparkles,
  Star,
  Target,
  Trophy,
  XCircle,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/shared/spinner";
import { useQuiz, useQuizReview } from "@/lib/hooks";
import { formatCoins } from "@/lib/utils";

// ── Score tier configuration ─────────────────────────────────────────────────
function getScoreTier(pct: number) {
  if (pct >= 90)
    return {
      grade: "A+",
      heading: "Outstanding! 🏆",
      sub: "You nailed it — near-perfect mastery!",
      icon: Trophy,
      iconClass: "text-amber-500",
      ringClass: "from-amber-500/25 to-orange-500/25 ring-amber-500/20",
    };
  if (pct >= 75)
    return {
      grade: "A",
      heading: "Great Work! 🎯",
      sub: "Strong performance — keep pushing!",
      icon: Star,
      iconClass: "text-sky-500",
      ringClass: "from-sky-500/25 to-blue-500/25 ring-sky-500/20",
    };
  if (pct >= 50)
    return {
      grade: "B",
      heading: "Keep Going! 💪",
      sub: "Solid attempt — review answers and sharpen your skills!",
      icon: Target,
      iconClass: "text-purple-500",
      ringClass: "from-purple-500/25 to-violet-500/25 ring-purple-500/20",
    };
  return {
    grade: "C",
    heading: "Keep Learning! 📚",
    sub: "Every attempt teaches you something new — try again!",
    icon: BookOpen,
    iconClass: "text-emerald-500",
    ringClass: "from-emerald-500/25 to-teal-500/25 ring-emerald-500/20",
  };
}

// ── Lightweight Confetti Canvas ──────────────────────────────────────────────
function ResultConfetti({ triggerKey }: { triggerKey: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const colors = ["#FF5722", "#FA4616", "#10B981", "#3B82F6", "#8B5CF6", "#F59E0B", "#EC4899"];
    const particles = Array.from({ length: 90 }).map(() => ({
      x: width / 2 + (Math.random() - 0.5) * 300,
      y: height / 3 + (Math.random() - 0.5) * 120,
      w: Math.random() * 10 + 6,
      h: Math.random() * 6 + 4,
      color: colors[Math.floor(Math.random() * colors.length)]!,
      vx: (Math.random() - 0.5) * 16,
      vy: -(Math.random() * 14 + 6),
      rotation: Math.random() * 360,
      vRot: (Math.random() - 0.5) * 14,
      opacity: 1,
    }));

    const startTime = Date.now();
    const duration = 3600;
    let animId: number;

    const render = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed > duration) {
        ctx.clearRect(0, 0, width, height);
        return;
      }

      ctx.clearRect(0, 0, width, height);
      const fadeProgress = Math.max(0, 1 - elapsed / duration);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.38; // gravity
        p.vx *= 0.98; // drag
        p.rotation += p.vRot;
        p.opacity = fadeProgress;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animId);
    };
  }, [triggerKey]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-50 h-full w-full"
      style={{ pointerEvents: "none" }}
    />
  );
}

export default function QuizResultsPage({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const { quizId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const attemptId =
    searchParams.get("attemptId") ?? searchParams.get("attempt") ?? "";

  const { data, isLoading } = useQuizReview(quizId, attemptId);
  const { data: quizData } = useQuiz(quizId);

  const [confettiKey, setConfettiKey] = useState(1);
  const [reviewFilter, setReviewFilter] = useState<"all" | "correct" | "incorrect">("all");

  const attempt = data?.attempt;
  const items = data?.items ?? [];

  const pct =
    attempt && attempt.maxScore > 0
      ? Math.round((attempt.score / attempt.maxScore) * 100)
      : 0;
  const xpEarned = attempt?.xpEarned ?? Math.round((pct / 100) * 100);
  const isSpeedBonus = (attempt as any)?.isSpeedBonus === true;

  const tier = getScoreTier(pct);
  const TierIcon = tier.icon;

  const quiz = quizData?.quiz;
  const existingAttemptNo = attempt?.attemptNo ?? 1;
  const maxAttempts = quiz?.settings?.maxAttempts ?? 1;
  const canRetry =
    quiz && existingAttemptNo < maxAttempts && quiz.status !== "closed";

  const filteredItems = useMemo(() => {
    if (reviewFilter === "correct") return items.filter((i) => i.earned > 0);
    if (reviewFilter === "incorrect") return items.filter((i) => i.earned === 0);
    return items;
  }, [items, reviewFilter]);

  const correctCount = items.filter((i) => i.earned > 0).length;
  const incorrectCount = items.length - correctCount;

  const handleShare = () => {
    const text = `I just scored ${attempt?.score}/${attempt?.maxScore} (${pct}%) on "${attempt?.quizTitle}" on UiZera! 🚀`;
    if (navigator.clipboard) {
      void navigator.clipboard.writeText(text);
      toast.success("Score summary copied to clipboard!");
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3">
        <Spinner className="h-9 w-9 text-uipath-orange" />
        <p className="text-sm font-semibold text-muted-foreground animate-pulse">
          Calculating your score & achievements...
        </p>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="container py-24 text-center max-w-md mx-auto space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <XCircle className="h-8 w-8" />
        </div>
        <h1 className="font-display text-2xl font-bold">Results Not Found</h1>
        <p className="text-sm text-muted-foreground">
          We couldn&apos;t load the quiz results for this attempt. Please try returning to the quizzes list.
        </p>
        <Button onClick={() => router.push("/quiz")} className="mt-2 gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Quizzes
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-12 space-y-8">
      {/* ── Confetti Celebration ────────────────────────────────────────── */}
      {pct >= 50 && <ResultConfetti triggerKey={confettiKey} />}

      {/* ── Score Header Card ──────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="relative overflow-hidden border-t-4 border-t-uipath-orange bg-card p-6 sm:p-10 text-center shadow-2xl">
          <div className="bg-grid pointer-events-none absolute inset-0 opacity-10" />

          <div className="relative">
            {/* Top Badge & Confetti trigger */}
            <div className="flex items-center justify-between mb-4">
              <Badge className="bg-uipath-orange/10 text-uipath-orange border-uipath-orange/20 font-bold">
                Quiz Completed
              </Badge>
              <button
                type="button"
                onClick={() => setConfettiKey((k) => k + 1)}
                className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                title="Trigger celebratory confetti"
              >
                <PartyPopper className="h-3.5 w-3.5 text-uipath-orange" /> Celebrate
              </button>
            </div>

            {/* Glowing Trophy Ring with Grade Stamp */}
            <div className="relative mx-auto mb-5 w-fit">
              <div
                className={`flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-tr ${tier.ringClass} ring-8 ring-offset-4 ring-offset-card shadow-inner`}
              >
                <TierIcon className={`h-12 w-12 ${tier.iconClass}`} />
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-background font-display font-extrabold text-sm shadow-md border-2 border-card">
                {tier.grade}
              </span>
            </div>

            {/* Headings */}
            <h1 className="font-display text-3xl font-extrabold sm:text-4xl tracking-tight">
              {tier.heading}
            </h1>
            <p className="mt-2 text-sm sm:text-base text-muted-foreground font-medium max-w-md mx-auto">
              {tier.sub}
            </p>
            <p className="mt-1 text-xs font-semibold text-brand-500">
              {attempt.quizTitle}
            </p>

            {/* Accuracy Progress Meter */}
            <div className="mt-6 max-w-md mx-auto space-y-1.5">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-muted-foreground">Accuracy Score</span>
                <span className="text-brand-500 font-mono text-sm">{pct}%</span>
              </div>
              <Progress value={pct} className="h-2.5 rounded-full" />
            </div>

            {/* 4-Column Stats Grid */}
            <div className="mt-8 grid gap-3.5 grid-cols-2 sm:grid-cols-4">
              <div className="rounded-2xl border bg-card/60 p-4 backdrop-blur-sm shadow-sm">
                <p className="font-display text-3xl font-extrabold text-brand-500">
                  {pct}%
                </p>
                <p className="text-xs font-semibold text-muted-foreground mt-1">
                  Accuracy
                </p>
              </div>

              <div className="rounded-2xl border bg-card/60 p-4 backdrop-blur-sm shadow-sm">
                <p className="font-display text-3xl font-extrabold text-foreground">
                  {attempt.score}{" "}
                  <span className="text-sm text-muted-foreground font-normal">
                    / {attempt.maxScore}
                  </span>
                </p>
                <p className="text-xs font-semibold text-muted-foreground mt-1">
                  Total Points
                </p>
              </div>

              <div className="rounded-2xl border bg-amber-500/5 border-amber-500/20 p-4 backdrop-blur-sm shadow-sm">
                <div className="flex items-center justify-center gap-1.5">
                  <Coins className="h-5 w-5 text-amber-500" />
                  <span className="font-display text-2xl font-extrabold text-amber-500">
                    +{formatCoins(attempt.coinsEarned)}
                  </span>
                </div>
                {isSpeedBonus ? (
                  <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                    ⚡ +10% Speed Bonus
                  </p>
                ) : (
                  <p className="text-xs font-semibold text-muted-foreground mt-1">
                    Coins Earned
                  </p>
                )}
              </div>

              <div className="rounded-2xl border bg-purple-500/5 border-purple-500/20 p-4 backdrop-blur-sm shadow-sm">
                <div className="flex items-center justify-center gap-1.5">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  <span className="font-display text-2xl font-extrabold text-purple-500">
                    +{xpEarned} XP
                  </span>
                </div>
                <p className="text-xs font-semibold text-muted-foreground mt-1">
                  Profile XP
                </p>
              </div>
            </div>

            {/* Action Buttons Row */}
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button
                variant="outline"
                onClick={() => router.push("/quiz")}
                className="gap-2 rounded-xl font-semibold"
              >
                <ArrowLeft className="h-4 w-4" /> All Quizzes
              </Button>

              {canRetry && (
                <Button
                  variant="outline"
                  onClick={() => router.push(`/quiz/${quizId}`)}
                  className="gap-2 rounded-xl border-brand-500/40 text-brand-600 dark:text-brand-400 hover:bg-brand-500/10 font-semibold"
                >
                  <RefreshCw className="h-4 w-4" /> Try Again ({existingAttemptNo}/{maxAttempts})
                </Button>
              )}

              <Button
                onClick={() => router.push("/leaderboard")}
                className="gap-2 bg-foreground text-background hover:bg-foreground/90 rounded-xl font-bold"
              >
                <Trophy className="h-4 w-4 text-amber-400" /> View Leaderboard
              </Button>

              <Button
                variant="secondary"
                onClick={handleShare}
                className="gap-2 rounded-xl font-semibold"
              >
                <Share2 className="h-4 w-4" /> Share Score
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* ── Item-by-item Review Section ───────────────────────────────────── */}
      {items.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-4"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
            <div>
              <h2 className="font-display text-xl font-bold flex items-center gap-2">
                <Zap className="h-5 w-5 text-uipath-orange" /> Question Review
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Review your answers, correct options, and detailed explanations
              </p>
            </div>

            {/* Review Filter Tabs */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setReviewFilter("all")}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-colors ${
                  reviewFilter === "all"
                    ? "bg-brand-500 text-white"
                    : "border bg-card hover:bg-accent text-muted-foreground"
                }`}
              >
                All ({items.length})
              </button>
              <button
                type="button"
                onClick={() => setReviewFilter("correct")}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-colors ${
                  reviewFilter === "correct"
                    ? "bg-emerald-600 text-white"
                    : "border bg-card hover:bg-accent text-emerald-600 dark:text-emerald-400"
                }`}
              >
                Correct ({correctCount})
              </button>
              <button
                type="button"
                onClick={() => setReviewFilter("incorrect")}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-colors ${
                  reviewFilter === "incorrect"
                    ? "bg-destructive text-white"
                    : "border bg-card hover:bg-accent text-destructive"
                }`}
              >
                Incorrect ({incorrectCount})
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {filteredItems.map((item, idx) => {
              const isCorrect = item.earned > 0;
              const isPartial =
                item.earned > 0 && item.earned < (item.question.points ?? 0);

              return (
                <Card
                  key={idx}
                  className={`border-2 transition-all shadow-sm ${
                    isCorrect
                      ? isPartial
                        ? "border-amber-500/30 bg-amber-500/5"
                        : "border-emerald-500/30 bg-emerald-500/5"
                      : "border-destructive/30 bg-destructive/5"
                  }`}
                >
                  <CardHeader className="flex flex-row items-start justify-between pb-3 gap-3">
                    <CardTitle className="text-base font-semibold leading-relaxed">
                      {idx + 1}. {item.question.prompt}
                    </CardTitle>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      {isCorrect ? (
                        isPartial ? (
                          <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300 gap-1 border-amber-500/30 font-bold">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Partial Credit
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 gap-1 border-emerald-500/30 font-bold">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Correct
                          </Badge>
                        )
                      ) : (
                        <Badge variant="destructive" className="gap-1 font-bold">
                          <XCircle className="h-3.5 w-3.5" /> Incorrect
                        </Badge>
                      )}
                      <span className="text-xs font-mono text-muted-foreground">
                        {item.earned} / {item.question.points} pts
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {/* Image if question had an illustration */}
                    {item.question.imageUrl && (
                      <div className="pb-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.question.imageUrl}
                          alt="Question diagram"
                          className="rounded-xl border max-h-48 w-full object-contain bg-muted p-2"
                        />
                      </div>
                    )}

                    <div className="grid gap-2 sm:grid-cols-2">
                      {item.question.options.map((opt, oIdx) => {
                        const isSelected = item.selected.includes(oIdx);
                        const isRight = item.correct.includes(oIdx);

                        let style = "border bg-card/70 text-muted-foreground";
                        if (isRight)
                          style =
                            "border-emerald-500 bg-emerald-500/15 font-semibold text-emerald-800 dark:text-emerald-200 ring-2 ring-emerald-500/30";
                        else if (isSelected && !isRight)
                          style =
                            "border-destructive bg-destructive/15 font-medium text-destructive ring-2 ring-destructive/30";

                        return (
                          <div
                            key={oIdx}
                            className={`rounded-xl p-3 text-xs sm:text-sm flex items-center justify-between transition-all ${style}`}
                          >
                            <span className="flex items-center gap-2.5">
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border font-mono font-bold text-xs bg-muted/50">
                                {String.fromCharCode(65 + oIdx)}
                              </span>
                              <span>{opt}</span>
                            </span>
                            {isRight && (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 ml-2" />
                            )}
                            {isSelected && !isRight && (
                              <XCircle className="h-4 w-4 text-destructive shrink-0 ml-2" />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {item.explanation && (
                      <div className="rounded-xl border border-border/60 bg-muted/50 p-3.5 text-xs text-muted-foreground leading-relaxed mt-2">
                        <span className="font-bold text-foreground flex items-center gap-1.5 mb-1">
                          <BookOpen className="h-3.5 w-3.5 text-brand-500" /> Explanation
                        </span>
                        {item.explanation}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}

