"use client";

import { use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Award,
  BookOpen,
  CheckCircle2,
  Coins,
  RefreshCw,
  Sparkles,
  Star,
  Target,
  Trophy,
  XCircle,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/shared/spinner";
import { useQuiz, useQuizReview } from "@/lib/hooks";
import { formatCoins } from "@/lib/utils";

// ── Score tier configuration ─────────────────────────────────────────────────
function getScoreTier(pct: number) {
  if (pct >= 90)
    return {
      heading: "Outstanding! 🏆",
      sub: "You nailed it — near-perfect mastery!",
      icon: Trophy,
      iconClass: "text-amber-500",
      ringClass: "from-amber-500/20 to-orange-500/20 ring-amber-500/10",
    };
  if (pct >= 70)
    return {
      heading: "Great Work! 🎯",
      sub: "Strong performance — keep pushing!",
      icon: Star,
      iconClass: "text-sky-500",
      ringClass: "from-sky-500/20 to-blue-500/20 ring-sky-500/10",
    };
  if (pct >= 50)
    return {
      heading: "Keep Going! 💪",
      sub: "Solid attempt — review and try again!",
      icon: Target,
      iconClass: "text-purple-500",
      ringClass: "from-purple-500/20 to-violet-500/20 ring-purple-500/10",
    };
  return {
    heading: "You Got This! 📚",
    sub: "Every attempt teaches you something new!",
    icon: BookOpen,
    iconClass: "text-emerald-500",
    ringClass: "from-emerald-500/20 to-teal-500/20 ring-emerald-500/10",
  };
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
  // We also fetch quiz meta to know if retries are available
  const { data: quizData } = useQuiz(quizId);

  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Spinner className="h-8 w-8 text-uipath-orange" />
      </div>
    );
  }

  const attempt = data?.attempt;
  const items = data?.items ?? [];

  if (!attempt) {
    return (
      <div className="container py-24 text-center max-w-md mx-auto space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <XCircle className="h-8 w-8" />
        </div>
        <h1 className="font-display text-2xl font-bold">Results Not Found</h1>
        <p className="text-sm text-muted-foreground">
          We couldn&apos;t load the quiz results for this attempt. Please try
          returning to the quizzes list.
        </p>
        <Button onClick={() => router.push("/quiz")} className="mt-2 gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Quizzes
        </Button>
      </div>
    );
  }

  const pct =
    attempt.maxScore > 0
      ? Math.round((attempt.score / attempt.maxScore) * 100)
      : 0;
  const xpEarned = attempt.xpEarned ?? Math.round((pct / 100) * 100);
  // isSpeedBonus is written by submit/route.ts into the attempt
  const isSpeedBonus = (attempt as any).isSpeedBonus === true;

  const tier = getScoreTier(pct);
  const TierIcon = tier.icon;

  // Can the student try again?
  const quiz = quizData?.quiz;
  const existingAttemptNo = attempt.attemptNo ?? 1;
  const maxAttempts = quiz?.settings?.maxAttempts ?? 1;
  const canRetry =
    quiz && existingAttemptNo < maxAttempts && quiz.status !== "closed";

  return (
    <div className="container max-w-3xl py-12 space-y-8">
      {/* ── Score Header Card ──────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="relative overflow-hidden border-t-4 border-t-uipath-orange bg-card p-8 text-center shadow-xl">
          <div className="bg-grid pointer-events-none absolute inset-0 opacity-10" />

          <div className="relative">
            <div
              className={`mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-tr ${tier.ringClass} ring-8`}
            >
              <TierIcon className={`h-10 w-10 ${tier.iconClass}`} />
            </div>

            {/* Badge row */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
              <Badge className="bg-uipath-orange/10 text-uipath-orange border-uipath-orange/20">
                Quiz Completed
              </Badge>
              {isSpeedBonus && (
                <Badge className="bg-amber-400/10 text-amber-600 dark:text-amber-400 border-amber-400/20 gap-1">
                  <Zap className="h-3 w-3" /> Speed Bonus
                </Badge>
              )}
            </div>

            <h1 className="font-display text-3xl font-extrabold sm:text-4xl">
              {tier.heading}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground font-medium">
              {tier.sub}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {attempt.quizTitle}
            </p>

            {/* Stats Grid */}
            <div className="mt-8 grid gap-4 grid-cols-2 sm:grid-cols-4">
              <div className="rounded-2xl border bg-card/60 p-4 backdrop-blur-sm">
                <p className="font-display text-3xl font-extrabold text-brand-500">
                  {pct}%
                </p>
                <p className="text-xs font-semibold text-muted-foreground mt-1">
                  Accuracy
                </p>
              </div>

              <div className="rounded-2xl border bg-card/60 p-4 backdrop-blur-sm">
                <p className="font-display text-3xl font-extrabold text-foreground">
                  {attempt.score}{" "}
                  <span className="text-sm text-muted-foreground font-normal">
                    / {attempt.maxScore}
                  </span>
                </p>
                <p className="text-xs font-semibold text-muted-foreground mt-1">
                  Score
                </p>
              </div>

              <div className="rounded-2xl border bg-card/60 p-4 backdrop-blur-sm">
                <div className="flex items-center justify-center gap-1">
                  <Coins className="h-5 w-5 text-amber-500" />
                  <span className="font-display text-2xl font-extrabold text-amber-500">
                    +{formatCoins(attempt.coinsEarned)}
                  </span>
                </div>
                {isSpeedBonus && (
                  <p className="text-xs text-amber-500/70 mt-0.5">+10% speed bonus</p>
                )}
                <p className="text-xs font-semibold text-muted-foreground mt-1">
                  Coins Earned
                </p>
              </div>

              <div className="rounded-2xl border bg-card/60 p-4 backdrop-blur-sm">
                <div className="flex items-center justify-center gap-1">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  <span className="font-display text-2xl font-extrabold text-purple-500">
                    +{xpEarned} XP
                  </span>
                </div>
                <p className="text-xs font-semibold text-muted-foreground mt-1">
                  XP Gained
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button
                variant="outline"
                onClick={() => router.push("/quiz")}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" /> All Quizzes
              </Button>

              {canRetry && (
                <Button
                  variant="outline"
                  onClick={() => router.push(`/quiz/${quizId}`)}
                  className="gap-2 border-brand-500/40 text-brand-600 dark:text-brand-400 hover:bg-brand-500/10"
                >
                  <RefreshCw className="h-4 w-4" /> Try Again
                </Button>
              )}

              <Button
                onClick={() => router.push("/achievements")}
                className="gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
              >
                <Award className="h-4 w-4" /> View Achievements
              </Button>

              <Button
                variant="secondary"
                onClick={() => router.push("/leaderboard")}
              >
                Leaderboard
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* ── Item-by-item review ───────────────────────────────────────────── */}
      {items.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold flex items-center gap-2">
              <Zap className="h-5 w-5 text-uipath-orange" /> Question Review
            </h2>
            <Badge variant="outline" className="text-xs">
              {items.filter((i) => i.earned > 0).length} of {items.length}{" "}
              correct
            </Badge>
          </div>

          {items.map((item, idx) => {
            const isCorrect = item.earned > 0;
            const isPartial =
              item.earned > 0 && item.earned < (item.question.points ?? 0);
            return (
              <Card
                key={idx}
                className={`border transition-all ${
                  isCorrect
                    ? isPartial
                      ? "border-amber-500/30 bg-amber-500/5"
                      : "border-emerald-500/30 bg-emerald-500/5"
                    : "border-destructive/30 bg-destructive/5"
                }`}
              >
                <CardHeader className="flex flex-row items-start justify-between pb-2 gap-3">
                  <CardTitle className="text-base font-semibold leading-relaxed">
                    {idx + 1}. {item.question.prompt}
                  </CardTitle>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {isCorrect ? (
                      isPartial ? (
                        <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400 gap-1 border-amber-500/30">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Partial
                        </Badge>
                      ) : (
                        <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 gap-1 border-emerald-500/30">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Correct
                        </Badge>
                      )
                    ) : (
                      <Badge variant="destructive" className="gap-1">
                        <XCircle className="h-3.5 w-3.5" /> Incorrect
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {item.earned} / {item.question.points} pts
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid gap-2 sm:grid-cols-2">
                    {item.question.options.map((opt, oIdx) => {
                      const isSelected = item.selected.includes(oIdx);
                      const isRight = item.correct.includes(oIdx);

                      let style =
                        "border bg-card/60 text-muted-foreground";
                      if (isRight)
                        style =
                          "border-emerald-500 bg-emerald-500/15 font-semibold text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/30";
                      else if (isSelected && !isRight)
                        style =
                          "border-destructive bg-destructive/15 font-medium text-destructive ring-1 ring-destructive/30";

                      return (
                        <div
                          key={oIdx}
                          className={`rounded-xl p-3 text-xs flex items-center justify-between transition-all ${style}`}
                        >
                          <span className="flex items-center gap-2">
                            <span className="font-bold">
                              {String.fromCharCode(65 + oIdx)}.
                            </span>
                            {opt}
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
                    <div className="rounded-xl border border-border/50 bg-muted/40 p-3 text-xs text-muted-foreground leading-relaxed">
                      <span className="font-semibold text-foreground">
                        Explanation:{" "}
                      </span>
                      {item.explanation}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
