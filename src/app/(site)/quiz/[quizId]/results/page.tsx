"use client";

import { use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, Coins, Sparkles, Trophy, XCircle, Zap, ArrowLeft, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/shared/spinner";
import { useQuizReview } from "@/lib/hooks";
import { formatCoins } from "@/lib/utils";

export default function QuizResultsPage({ params }: { params: Promise<{ quizId: string }> }) {
  const { quizId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const attemptId = searchParams.get("attemptId") ?? searchParams.get("attempt") ?? "";

  const { data, isLoading } = useQuizReview(quizId, attemptId);

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
          We couldn&apos;t load the quiz results for this attempt. Please try returning to the quizzes list.
        </p>
        <Button onClick={() => router.push("/quiz")} className="mt-2 gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Quizzes
        </Button>
      </div>
    );
  }

  const pct = attempt.maxScore > 0 ? Math.round((attempt.score / attempt.maxScore) * 100) : 0;
  const xpEarned = attempt.xpEarned ?? Math.round((pct / 100) * 100);

  return (
    <div className="container max-w-3xl py-12 space-y-8">
      {/* Score Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="relative overflow-hidden border-t-4 border-t-uipath-orange bg-card p-8 text-center shadow-xl">
          <div className="bg-grid pointer-events-none absolute inset-0 opacity-10" />
          
          <div className="relative">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500/20 to-orange-500/20 ring-8 ring-amber-500/10">
              <Trophy className="h-10 w-10 text-amber-500 animate-bounce" />
            </div>

            <Badge className="mb-2 bg-uipath-orange/10 text-uipath-orange border-uipath-orange/20">
              Quiz Completed
            </Badge>
            <h1 className="font-display text-3xl font-extrabold sm:text-4xl">
              Great Job!
            </h1>
            <p className="mt-1 text-sm text-muted-foreground font-medium">{attempt.quizTitle}</p>

            {/* Stats Grid */}
            <div className="mt-8 grid gap-4 grid-cols-2 sm:grid-cols-4">
              <div className="rounded-2xl border bg-card/60 p-4 backdrop-blur-sm">
                <p className="font-display text-3xl font-extrabold text-brand-500">{pct}%</p>
                <p className="text-xs font-semibold text-muted-foreground mt-1">Accuracy</p>
              </div>

              <div className="rounded-2xl border bg-card/60 p-4 backdrop-blur-sm">
                <p className="font-display text-3xl font-extrabold text-foreground">
                  {attempt.score} <span className="text-sm text-muted-foreground font-normal">/ {attempt.maxScore}</span>
                </p>
                <p className="text-xs font-semibold text-muted-foreground mt-1">Score</p>
              </div>

              <div className="rounded-2xl border bg-card/60 p-4 backdrop-blur-sm">
                <div className="flex items-center justify-center gap-1">
                  <Coins className="h-5 w-5 text-amber-500" />
                  <span className="font-display text-2xl font-extrabold text-amber-500">
                    +{formatCoins(attempt.coinsEarned)}
                  </span>
                </div>
                <p className="text-xs font-semibold text-muted-foreground mt-1">Coins Earned</p>
              </div>

              <div className="rounded-2xl border bg-card/60 p-4 backdrop-blur-sm">
                <div className="flex items-center justify-center gap-1">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  <span className="font-display text-2xl font-extrabold text-purple-500">
                    +{xpEarned} XP
                  </span>
                </div>
                <p className="text-xs font-semibold text-muted-foreground mt-1">XP Gained</p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button variant="outline" onClick={() => router.push("/quiz")} className="gap-2">
                <ArrowLeft className="h-4 w-4" /> All Quizzes
              </Button>
              <Button onClick={() => router.push("/achievements")} className="gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                <Award className="h-4 w-4" /> View Achievements
              </Button>
              <Button variant="secondary" onClick={() => router.push("/leaderboard")}>
                Leaderboard
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Item-by-item review */}
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
              {items.filter((i) => i.earned > 0).length} of {items.length} Correct
            </Badge>
          </div>

          {items.map((item, idx) => {
            const isCorrect = item.earned > 0;
            return (
              <Card key={idx} className={`border transition-all ${isCorrect ? "border-emerald-500/30 bg-emerald-500/5" : "border-destructive/30 bg-destructive/5"}`}>
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <CardTitle className="text-base font-semibold leading-relaxed">
                    {idx + 1}. {item.question.prompt}
                  </CardTitle>
                  {isCorrect ? (
                    <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 gap-1 border-emerald-500/30 shrink-0">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Correct
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="gap-1 shrink-0">
                      <XCircle className="h-3.5 w-3.5" /> Incorrect
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid gap-2 sm:grid-cols-2">
                    {item.question.options.map((opt, oIdx) => {
                      const isSelected = item.selected.includes(oIdx);
                      const isRight = item.correct.includes(oIdx);

                      let style = "border bg-card/60 text-muted-foreground";
                      if (isRight) style = "border-emerald-500 bg-emerald-500/15 font-semibold text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/30";
                      else if (isSelected && !isRight) style = "border-destructive bg-destructive/15 font-medium text-destructive ring-1 ring-destructive/30";

                      return (
                        <div key={oIdx} className={`rounded-xl p-3 text-xs flex items-center justify-between transition-all ${style}`}>
                          <span>{opt}</span>
                          {isRight && <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 ml-2" />}
                          {isSelected && !isRight && <XCircle className="h-4 w-4 text-destructive shrink-0 ml-2" />}
                        </div>
                      );
                    })}
                  </div>

                  {item.explanation && (
                    <div className="rounded-xl border border-border/50 bg-muted/40 p-3 text-xs text-muted-foreground leading-relaxed">
                      <span className="font-semibold text-foreground">Explanation: </span>
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
