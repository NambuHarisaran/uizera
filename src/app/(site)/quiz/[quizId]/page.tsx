"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Clock, Coins, HelpCircle, ShieldAlert, Sparkles, Trophy, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/shared/spinner";
import { useQuiz } from "@/lib/hooks";
import { formatCoins, formatDuration } from "@/lib/utils";

export default function QuizPlayPage({ params }: { params: Promise<{ quizId: string }> }) {
  const { quizId } = use(params);
  const router = useRouter();
  const { data, isLoading } = useQuiz(quizId);

  const [attempting, setAttempting] = useState(false);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, number[]>>({});
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const quiz = data?.quiz;
  const existingAttempt = data?.attempt;

  // Countdown timer
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || !attempting) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          handleSubmitQuiz(); // Auto submit on expiry
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, attempting]);

  const handleStartQuiz = async () => {
    setAttempting(true);
    try {
      const res = await fetch(`/api/quiz/${quizId}/start`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error ?? "Could not start quiz.");
      }
      const result = await res.json();
      setAttemptId(result.data.attemptId);
      setQuestions(result.data.questions);
      setTimeLeft(result.data.durationSeconds);
      toast.success("Quiz started! Good luck!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start quiz.");
      setAttempting(false);
    }
  };

  const handleOptionSelect = (qId: string, optionIdx: number) => {
    setAnswers((prev) => ({
      ...prev,
      [qId]: [optionIdx],
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!attemptId) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/quiz/${quizId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId,
          answers,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error ?? "Failed to submit quiz.");
      }

      toast.success("Quiz submitted successfully!");
      router.push(`/quiz/${quizId}/results?attemptId=${attemptId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error submitting quiz.");
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="container py-24 text-center">
        <h1 className="font-display text-2xl font-bold">Quiz Not Found</h1>
        <Button onClick={() => router.push("/quiz")} className="mt-4">
          Back to Quizzes
        </Button>
      </div>
    );
  }

  // If already submitted
  if (existingAttempt && existingAttempt.status === "submitted" && !attempting) {
    return (
      <div className="container max-w-xl py-24 text-center">
        <Card className="p-8">
          <Trophy className="mx-auto mb-4 h-12 w-12 text-amber-500" />
          <h1 className="font-display text-2xl font-bold">Quiz Already Completed!</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You scored {existingAttempt.score} / {existingAttempt.maxScore} points and earned{" "}
            {existingAttempt.coinsEarned} coins.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button variant="outline" onClick={() => router.push("/quiz")}>
              All Quizzes
            </Button>
            <Button onClick={() => router.push(`/quiz/${quizId}/results?attemptId=${existingAttempt.id}`)}>
              View Detailed Results
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Active quiz attempt UI
  if (attempting && questions.length > 0) {
    const currentQ = questions[currentQIndex];
    const isLastQ = currentQIndex === questions.length - 1;
    const progressPct = ((currentQIndex + 1) / questions.length) * 100;

    return (
      <div className="container max-w-3xl py-12 space-y-6">
        {/* Header bar */}
        <div className="flex items-center justify-between rounded-xl border bg-card p-4">
          <div>
            <h2 className="font-display text-lg font-bold">{quiz.title}</h2>
            <p className="text-xs text-muted-foreground">
              Question {currentQIndex + 1} of {questions.length}
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-lg font-bold text-amber-500">
            <Clock className="h-5 w-5" />
            {timeLeft !== null ? formatDuration(timeLeft) : "--:--"}
          </div>
        </div>

        <Progress value={progressPct} className="h-2" />

        {/* Question Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl leading-relaxed">
              {currentQIndex + 1}. {currentQ.prompt}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {currentQ.options.map((opt: string, oIdx: number) => {
              const isSelected = answers[currentQ.id]?.includes(oIdx);
              return (
                <button
                  key={oIdx}
                  type="button"
                  onClick={() => handleOptionSelect(currentQ.id, oIdx)}
                  className={`flex w-full items-center justify-between rounded-xl border p-4 text-left font-medium transition-all ${
                    isSelected
                      ? "border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400"
                      : "hover:bg-accent"
                  }`}
                >
                  <span>{opt}</span>
                  {isSelected && <CheckCircle2 className="h-5 w-5 text-brand-500" />}
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4">
          <Button
            variant="outline"
            disabled={currentQIndex === 0}
            onClick={() => setCurrentQIndex((prev) => prev - 1)}
          >
            Previous
          </Button>

          {isLastQ ? (
            <Button onClick={handleSubmitQuiz} disabled={submitting} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
              {submitting ? <Spinner className="text-white" /> : <Sparkles className="h-4 w-4" />}
              Submit Quiz
            </Button>
          ) : (
            <Button onClick={() => setCurrentQIndex((prev) => prev + 1)}>Next Question</Button>
          )}
        </div>
      </div>
    );
  }

  // Pre-quiz landing detail
  return (
    <div className="container max-w-2xl py-16">
      <Card className="p-8">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-sm font-medium text-brand-600 dark:text-brand-400">
          <Zap className="h-4 w-4" /> Ready to Play
        </div>

        <h1 className="font-display text-3xl font-bold">{quiz.title}</h1>
        {quiz.description && <p className="mt-2 text-muted-foreground">{quiz.description}</p>}

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border bg-muted/30 p-4 text-center">
            <HelpCircle className="mx-auto mb-2 h-5 w-5 text-brand-500" />
            <p className="font-display text-lg font-bold">{quiz.questionCount}</p>
            <p className="text-xs text-muted-foreground">Questions</p>
          </div>

          <div className="rounded-xl border bg-muted/30 p-4 text-center">
            <Clock className="mx-auto mb-2 h-5 w-5 text-brand-500" />
            <p className="font-display text-lg font-bold">
              {formatDuration(quiz.durationSeconds)}
            </p>
            <p className="text-xs text-muted-foreground">Time Limit</p>
          </div>

          <div className="rounded-xl border bg-muted/30 p-4 text-center">
            <Coins className="mx-auto mb-2 h-5 w-5 text-amber-500" />
            <p className="font-display text-lg font-bold">
              {formatCoins(quiz.totalPoints * quiz.coinsPerPoint)}
            </p>
            <p className="text-xs text-muted-foreground">Max Reward</p>
          </div>
        </div>

        <div className="mt-8 flex gap-4">
          <Button variant="outline" onClick={() => router.push("/quiz")} className="flex-1">
            Back to List
          </Button>
          <Button onClick={handleStartQuiz} className="flex-1 gap-2">
            <Zap className="h-4 w-4" /> Start Quiz Now
          </Button>
        </div>
      </Card>
    </div>
  );
}
