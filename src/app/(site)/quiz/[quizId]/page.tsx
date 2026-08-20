"use client";

import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  CheckSquare,
  Circle,
  Clock,
  Coins,
  Flag,
  HelpCircle,
  SkipForward,
  Sparkles,
  Trophy,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/shared/spinner";
import { useQuiz } from "@/lib/hooks";
import { formatCoins, formatDuration } from "@/lib/utils";
import type { QuestionType } from "@/types";

// Simple debounce utility — avoids importing a library
function debounce<T extends (...args: any[]) => any>(fn: T, wait: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  }) as T;
}

export default function QuizPlayPage({ params }: { params: Promise<{ quizId: string }> }) {
  const { quizId } = use(params);
  const router = useRouter();
  const { data, isLoading } = useQuiz(quizId);

  // ── Attempt state ─────────────────────────────────────────────────────────
  const [attempting, setAttempting] = useState(false);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Array<{
    id: string;
    type: QuestionType;
    prompt: string;
    imageUrl: string | null;
    options: string[];
    points: number;
  }>>([]);
  const [answers, setAnswers] = useState<Record<string, number[]>>({});
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showNavigator, setShowNavigator] = useState(false);

  // ── Stable refs to break stale closures ──────────────────────────────────
  const answersRef = useRef<Record<string, number[]>>({});
  const attemptIdRef = useRef<string | null>(null);
  const submittingRef = useRef(false);
  const deadlineAtRef = useRef<number | null>(null);

  // Keep refs in sync with state
  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { attemptIdRef.current = attemptId; }, [attemptId]);
  useEffect(() => { submittingRef.current = submitting; }, [submitting]);

  const quiz = data?.quiz;
  const existingAttempt = data?.attempt;

  // ── Submit handler (stable, uses refs not closures) ────────────────────
  const handleSubmitQuiz = useCallback(async (forcedAnswers?: Record<string, number[]>) => {
    const id = attemptIdRef.current;
    if (!id || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    const finalAnswers = forcedAnswers ?? answersRef.current;
    try {
      const res = await fetch(`/api/quiz/${quizId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId: id, answers: finalAnswers }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error ?? "Submission failed.");
      }
      toast.success("Quiz submitted successfully!");
      router.push(`/quiz/${quizId}/results?attemptId=${id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error submitting quiz.");
      submittingRef.current = false;
      setSubmitting(false);
    }
  }, [quizId, router]);

  // ── Countdown timer — uses wall-clock calculation against deadlineAt ─────────────
  useEffect(() => {
    if (!attempting || !deadlineAtRef.current) return;
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((deadlineAtRef.current! - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        void handleSubmitQuiz(answersRef.current);
      }
    }, 500);
    return () => clearInterval(timer);
  }, [attempting, handleSubmitQuiz]);

  // ── Debounced auto-save ──────────────────────────────────────────────────
  const debouncedSave = useMemo(
    () =>
      debounce(async (latestAnswers: Record<string, number[]>, aid: string) => {
        try {
          await fetch(`/api/quiz/${quizId}/save-answer`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ attemptId: aid, answers: latestAnswers }),
          });
        } catch {
          // Silent — submit is the authoritative source of truth
        }
      }, 800),
    [quizId]
  );

  useEffect(() => {
    if (attempting && attemptId && Object.keys(answers).length > 0) {
      debouncedSave(answers, attemptId);
    }
  }, [answers, attempting, attemptId, debouncedSave]);

  // ── Start quiz ────────────────────────────────────────────────────────────
  const handleStartQuiz = async () => {
    setAttempting(true);
    try {
      const res = await fetch(`/api/quiz/${quizId}/start`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error ?? "Could not start quiz.");
      }
      const result = await res.json();
      setAttemptId(result.data.attemptId);
      setQuestions(result.data.questions);
      deadlineAtRef.current = result.data.deadlineAt;
      // Use deadlineAt so timer is resume-safe after a hard refresh
      const secondsLeft = Math.max(
        0,
        Math.floor((result.data.deadlineAt - Date.now()) / 1000)
      );
      setTimeLeft(secondsLeft);
      // Restore saved answers if resuming
      if (result.data.answers && Object.keys(result.data.answers).length > 0) {
        setAnswers(result.data.answers);
        toast.info("Quiz resumed — your previous answers have been restored.");
      } else {
        toast.success("Quiz started! Good luck!");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start quiz.");
      setAttempting(false);
    }
  };


  // ── Answer selection (type-aware) ─────────────────────────────────────────
  const handleOptionSelect = (qId: string, optionIdx: number, type: QuestionType) => {
    setAnswers((prev) => {
      const current = prev[qId] ?? [];
      if (type === "multi_select") {
        // Toggle: add if not selected, remove if already selected
        const next = current.includes(optionIdx)
          ? current.filter((i) => i !== optionIdx)
          : [...current, optionIdx];
        return { ...prev, [qId]: next };
      }
      // Single-select types: mcq, true_false, image
      return { ...prev, [qId]: [optionIdx] };
    });
  };

  // ── Timer colour ──────────────────────────────────────────────────────────
  const timerColor =
    timeLeft !== null && timeLeft <= 30
      ? "text-red-500 animate-pulse"
      : "text-amber-500";

  // ── Loading state ─────────────────────────────────────────────────────────
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

  // ── Already submitted ─────────────────────────────────────────────────────
  if (existingAttempt && existingAttempt.status === "submitted" && !attempting) {
    return (
      <div className="container max-w-xl py-24 text-center">
        <Card className="p-8">
          <Trophy className="mx-auto mb-4 h-12 w-12 text-amber-500" />
          <h1 className="font-display text-2xl font-bold">Quiz Already Completed!</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You scored {existingAttempt.score} / {existingAttempt.maxScore} points and
            earned {existingAttempt.coinsEarned} coins.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Button variant="outline" onClick={() => router.push("/quiz")}>
              All Quizzes
            </Button>
            <Button
              onClick={() =>
                router.push(`/quiz/${quizId}/results?attemptId=${existingAttempt.id}`)
              }
            >
              View Detailed Results
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // ── Active quiz attempt UI ────────────────────────────────────────────────
  if (attempting && questions.length > 0) {
    const currentQ = questions[currentQIndex]!;
    const isLastQ = currentQIndex === questions.length - 1;
    const progressPct = ((currentQIndex + 1) / questions.length) * 100;
    const answeredCount = Object.keys(answers).filter(
      (qid) => (answers[qid]?.length ?? 0) > 0
    ).length;
    const isMultiSelect = currentQ.type === "multi_select";

    return (
      <div className="container max-w-3xl py-8 space-y-5">
        {/* ── Header bar ────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-3 rounded-xl border bg-card p-4 shadow-sm">
          <div className="min-w-0">
            <h2 className="truncate font-display text-lg font-bold" title={quiz.title}>
              {quiz.title}
            </h2>
            <p className="text-xs text-muted-foreground">
              Question {currentQIndex + 1} of {questions.length} ·{" "}
              <span className="text-brand-500 font-medium">{answeredCount} answered</span>
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setShowNavigator((v) => !v)}
              className="hidden sm:flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-accent transition-colors"
            >
              <Flag className="h-3.5 w-3.5" /> Navigator
            </button>
            <div className={`flex items-center gap-1.5 font-mono text-lg font-bold ${timerColor}`}>
              <Clock className="h-5 w-5" />
              {timeLeft !== null ? formatDuration(timeLeft) : "--:--"}
            </div>
          </div>
        </div>

        {/* ── Progress bar ──────────────────────────────────────────────── */}
        <Progress value={progressPct} className="h-1.5" />

        {/* ── Question Navigator (collapsible) ─────────────────────────── */}
        <AnimatePresence>
          {showNavigator && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <Card className="p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Jump to question
                </p>
                <div className="flex flex-wrap gap-2">
                  {questions.map((q, idx) => {
                    const isAnswered = (answers[q.id]?.length ?? 0) > 0;
                    const isCurrent = idx === currentQIndex;
                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => {
                          setCurrentQIndex(idx);
                          setShowNavigator(false);
                        }}
                        className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold transition-all ${
                          isCurrent
                            ? "bg-brand-500 text-white ring-2 ring-brand-500/50"
                            : isAnswered
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                            : "border bg-card hover:bg-accent"
                        }`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-3 flex gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded bg-emerald-500/20 border border-emerald-500/40" />
                    Answered
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded border" />
                    Not answered
                  </span>
                </p>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Question Card ─────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQ.id}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-xl leading-relaxed">
                    {currentQIndex + 1}. {currentQ.prompt}
                  </CardTitle>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Badge variant="outline" className="text-xs">
                      {currentQ.points} pt{currentQ.points !== 1 ? "s" : ""}
                    </Badge>
                    {isMultiSelect && (
                      <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 text-xs">
                        <CheckSquare className="mr-1 h-3 w-3" /> Multi-select
                      </Badge>
                    )}
                  </div>
                </div>
                {isMultiSelect && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Select all that apply. Partial credit awarded.
                  </p>
                )}
              </CardHeader>

              {/* Image for image-type questions */}
              {currentQ.imageUrl && (
                <div className="px-6 pb-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={currentQ.imageUrl}
                    alt="Question illustration"
                    className="rounded-xl border max-h-56 w-full object-contain bg-muted"
                  />
                </div>
              )}

              <CardContent className="space-y-3">
                {currentQ.options.map((opt, oIdx) => {
                  const isSelected = answers[currentQ.id]?.includes(oIdx) ?? false;
                  return (
                    <button
                      key={oIdx}
                      type="button"
                      role={isMultiSelect ? "checkbox" : "radio"}
                      aria-checked={isSelected}
                      onClick={() =>
                        handleOptionSelect(currentQ.id, oIdx, currentQ.type)
                      }
                      className={`flex w-full items-center justify-between rounded-xl border p-4 text-left font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        isSelected
                          ? "border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400"
                          : "hover:bg-accent"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        {/* Option letter label */}
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                            isSelected
                              ? "border-brand-500 bg-brand-500 text-white"
                              : "border-border"
                          }`}
                        >
                          {String.fromCharCode(65 + oIdx)}
                        </span>
                        <span>{opt}</span>
                      </span>
                      {isSelected &&
                        (isMultiSelect ? (
                          <CheckSquare className="h-5 w-5 shrink-0 text-brand-500" />
                        ) : (
                          <CheckCircle2 className="h-5 w-5 shrink-0 text-brand-500" />
                        ))}
                      {!isSelected && <Circle className="h-5 w-5 shrink-0 text-muted-foreground/30" />}
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* ── Navigation ────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <Button
            variant="outline"
            disabled={currentQIndex === 0}
            onClick={() => setCurrentQIndex((prev) => prev - 1)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" /> Previous
          </Button>

          <div className="flex items-center gap-2">
            {/* Skip button */}
            {!isLastQ && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentQIndex((prev) => prev + 1)}
                className="gap-1.5 text-muted-foreground hover:text-foreground"
              >
                Skip <SkipForward className="h-4 w-4" />
              </Button>
            )}

            {isLastQ ? (
              <Button
                onClick={() => void handleSubmitQuiz()}
                disabled={submitting}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {submitting ? <Spinner className="text-white" /> : <Sparkles className="h-4 w-4" />}
                {submitting ? "Submitting…" : `Submit Quiz (${answeredCount}/${questions.length})`}
              </Button>
            ) : (
              <Button
                onClick={() => setCurrentQIndex((prev) => prev + 1)}
                className="gap-2"
              >
                Next Question
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Pre-quiz landing ──────────────────────────────────────────────────────
  return (
    <div className="container max-w-2xl py-16">
      <Card className="p-8">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-sm font-medium text-brand-600 dark:text-brand-400">
          <Zap className="h-4 w-4" /> Ready to Play
        </div>

        <h1 className="font-display text-3xl font-bold">{quiz.title}</h1>
        {quiz.description && (
          <p className="mt-2 text-muted-foreground">{quiz.description}</p>
        )}

        <div className="mt-8 grid gap-4 grid-cols-1 sm:grid-cols-3">
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

        {/* Settings info pills */}
        <div className="mt-5 flex flex-wrap gap-2">
          <Badge variant="outline" className="text-xs gap-1">
            <Trophy className="h-3 w-3" />
            {quiz.settings.maxAttempts} attempt{quiz.settings.maxAttempts !== 1 ? "s" : ""}
          </Badge>
          {quiz.settings.randomizeQuestions && (
            <Badge variant="outline" className="text-xs">Questions shuffled</Badge>
          )}
          {quiz.settings.showReview && (
            <Badge variant="outline" className="text-xs">Review available after</Badge>
          )}
          <Badge variant="outline" className="text-xs gap-1 text-amber-600 border-amber-500/30">
            <Zap className="h-3 w-3" /> Speed bonus eligible
          </Badge>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-3">
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
