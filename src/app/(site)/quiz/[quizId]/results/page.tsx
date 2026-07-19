"use client";

import { use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Coins, Trophy, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/shared/spinner";
import { useQuizReview } from "@/lib/hooks";
import { formatCoins } from "@/lib/utils";

export default function QuizResultsPage({ params }: { params: Promise<{ quizId: string }> }) {
  const { quizId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const attemptId = searchParams.get("attemptId") ?? "";

  const { data, isLoading } = useQuizReview(quizId, attemptId);

  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const attempt = data?.attempt;
  const items = data?.items ?? [];

  if (!attempt) {
    return (
      <div className="container py-24 text-center">
        <h1 className="font-display text-2xl font-bold">Results Not Found</h1>
        <Button onClick={() => router.push("/quiz")} className="mt-4">
          Back to Quizzes
        </Button>
      </div>
    );
  }

  const pct = attempt.maxScore > 0 ? Math.round((attempt.score / attempt.maxScore) * 100) : 0;

  return (
    <div className="container max-w-3xl py-16 space-y-8">
      {/* Score Header Card */}
      <Card className="text-center p-8 border-t-4 border-t-uipath-orange">
        <Trophy className="mx-auto mb-3 h-16 w-16 text-amber-500" />
        <h1 className="font-display text-3xl font-bold">Quiz Completed!</h1>
        <p className="mt-1 text-muted-foreground">{attempt.quizTitle}</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border bg-card p-4">
            <p className="font-display text-3xl font-bold text-brand-500">{pct}%</p>
            <p className="text-xs text-muted-foreground">Accuracy</p>
          </div>

          <div className="rounded-xl border bg-card p-4">
            <p className="font-display text-3xl font-bold">
              {attempt.score} / {attempt.maxScore}
            </p>
            <p className="text-xs text-muted-foreground">Score</p>
          </div>

          <div className="rounded-xl border bg-card p-4">
            <p className="font-display text-3xl font-bold text-amber-500">
              +{formatCoins(attempt.coinsEarned)}
            </p>
            <p className="text-xs text-muted-foreground">Coins Earned</p>
          </div>
        </div>

        <div className="mt-8 flex justify-center gap-4">
          <Button variant="outline" onClick={() => router.push("/quiz")}>
            All Quizzes
          </Button>
          <Button onClick={() => router.push("/leaderboard")}>View Leaderboard</Button>
        </div>
      </Card>

      {/* Item-by-item review */}
      {items.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-display text-xl font-bold">Question Review</h2>
          {items.map((item, idx) => {
            const isCorrect = item.earned > 0;
            return (
              <Card key={idx} className={isCorrect ? "border-emerald-500/30" : "border-destructive/30"}>
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <CardTitle className="text-base font-semibold">
                    {idx + 1}. {item.question.prompt}
                  </CardTitle>
                  {isCorrect ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                  ) : (
                    <XCircle className="h-5 w-5 shrink-0 text-destructive" />
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid gap-2 sm:grid-cols-2">
                    {item.question.options.map((opt, oIdx) => {
                      const isSelected = item.selected.includes(oIdx);
                      const isRight = item.correct.includes(oIdx);

                      let style = "border bg-card";
                      if (isRight) style = "border-emerald-500 bg-emerald-500/10 font-semibold text-emerald-600 dark:text-emerald-400";
                      else if (isSelected && !isRight) style = "border-destructive bg-destructive/10 text-destructive";

                      return (
                        <div key={oIdx} className={`rounded-lg p-3 text-xs ${style}`}>
                          {opt}
                        </div>
                      );
                    })}
                  </div>

                  {item.explanation && (
                    <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">Explanation: </span>
                      {item.explanation}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
