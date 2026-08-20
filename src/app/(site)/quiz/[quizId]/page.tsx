"use client";

import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CheckSquare,
  Circle,
  Clock,
  Coins,
  Compass,
  Flag,
  HelpCircle,
  Keyboard,
  RotateCcw,
  ShieldAlert,
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
  const handleOptionSelect = useCallback((qId: string, optionIdx: number, type: QuestionType) => {
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
  }, []);

  // ── Keyboard Shortcuts (1, 2, 3, 4 / A, B, C, D, ArrowLeft, ArrowRight) ─────
  useEffect(() => {
    if (!attempting || questions.length === 0) return;
    const currentQ = questions[currentQIndex];
    if (!currentQ) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing inside input or textarea
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) return;

      const key = e.key.toLowerCase();
      let optIdx: number | null = null;
      if (key === "1" || key === "a") optIdx = 0;
      else if (key === "2" || key === "b") optIdx = 1;
      else if (key === "3" || key === "c") optIdx = 2;
      else if (key === "4" || key === "d") optIdx = 3;
      else if (key === "5" || key === "e") optIdx = 4;
      else if (key === "6" || key === "f") optIdx = 5;

      if (optIdx !== null && optIdx < currentQ.options.length) {
        e.preventDefault();
        handleOptionSelect(currentQ.id, optIdx, currentQ.type);
      } else if (e.key === "ArrowLeft" && currentQIndex > 0) {
        e.preventDefault();
        setCurrentQIndex((prev) => prev - 1);
      } else if (e.key === "ArrowRight" && currentQIndex < questions.length - 1) {
        e.preventDefault();
        setCurrentQIndex((prev) => prev + 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [attempting, questions, currentQIndex, handleOptionSelect]);

  // ── Timer colour & warning states ─────────────────────────────────────────
  const isUrgent = timeLeft !== null && timeLeft <= 30;
  const isCritical = timeLeft !== null && timeLeft <= 15;
  const timerColor = isCritical
    ? "text-red-500 font-extrabold animate-pulse"
    : isUrgent
    ? "text-amber-500 font-bold"
    : "text-brand-500 font-semibold";

  // ── Loading state ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3">
        <Spinner className="h-9 w-9 text-brand-500" />
        <p className="text-sm text-muted-foreground font-medium animate-pulse">Loading quiz...</p>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="container py-24 text-center max-w-md mx-auto space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <h1 className="font-display text-2xl font-bold">Quiz Not Found</h1>
        <p className="text-sm text-muted-foreground">
          The quiz you are looking for might have been moved or removed.
        </p>
        <Button onClick={() => router.push("/quiz")} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Quizzes
        </Button>
      </div>
    );
  }

  // ── Already submitted ─────────────────────────────────────────────────────
  if (existingAttempt && existingAttempt.status === "submitted" && !attempting) {
    const accuracy =
      existingAttempt.maxScore > 0
        ? Math.round((existingAttempt.score / existingAttempt.maxScore) * 100)
        : 0;

    return (
      <div className="container max-w-xl py-20 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="border-t-4 border-t-amber-500 p-8 shadow-xl">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
              <Trophy className="h-8 w-8 animate-bounce" />
            </div>
            <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 mb-3">
              Quiz Already Completed
            </Badge>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold">{quiz.title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              You scored <span className="font-bold text-foreground">{existingAttempt.score} / {existingAttempt.maxScore}</span> points ({accuracy}% accuracy) and
              earned <span className="font-bold text-amber-500">+{formatCoins(existingAttempt.coinsEarned)} coins</span>.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button variant="outline" onClick={() => router.push("/quiz")} className="gap-2">
                <ArrowLeft className="h-4 w-4" /> All Quizzes
              </Button>
              <Button
                onClick={() =>
                  router.push(`/quiz/${quizId}/results?attemptId=${existingAttempt.id}`)
                }
                className="gap-2 bg-brand-500 hover:bg-brand-600 font-bold"
              >
                <Sparkles className="h-4 w-4" /> View Detailed Results
              </Button>
            </div>
          </Card>
        </motion.div>
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
      <div className="container max-w-3xl py-8 space-y-5 select-none">
        {/* ── Header bar ────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-3 rounded-2xl border bg-card/95 backdrop-blur-md p-4 shadow-sm">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-brand-500">
                Q{currentQIndex + 1}/{questions.length}
              </span>
              <h2 className="truncate font-display text-base sm:text-lg font-bold" title={quiz.title}>
                {quiz.title}
              </h2>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
              <span>{answeredCount} of {questions.length} answered</span>
              <span>•</span>
              <span className="hidden sm:inline text-muted-foreground/80">Press keys 1-4 or A-D to select</span>
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setShowNavigator((v) => !v)}
              className="flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold hover:bg-accent transition-colors"
            >
              <Flag className="h-3.5 w-3.5 text-brand-500" />
              <span className="hidden sm:inline">Navigator</span>
            </button>
            <div className={`flex items-center gap-1.5 font-mono text-base sm:text-lg px-3 py-1 rounded-xl border ${
              isUrgent ? "border-red-500/40 bg-red-500/10 " + timerColor : "border-border bg-muted/40 " + timerColor
            }`}>
              <Clock className="h-4 w-4 shrink-0" />
              {timeLeft !== null ? formatDuration(timeLeft) : "--:--"}
            </div>
          </div>
        </div>

        {/* ── Progress bar ──────────────────────────────────────────────── */}
        <div className="space-y-1">
          <Progress value={progressPct} className="h-2 rounded-full" />
          {isUrgent && (
            <p className="text-[11px] text-red-500 font-semibold text-right animate-pulse">
              ⚡ Time is running out! Submit when finished.
            </p>
          )}
        </div>

        {/* ── Question Navigator (collapsible) ─────────────────────────── */}
        <AnimatePresence>
          {showNavigator && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <Card className="p-4 border-2 border-brand-500/20">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Question Navigator
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowNavigator(false)}
                    className="text-xs text-muted-foreground hover:text-foreground font-semibold"
                  >
                    Close ✕
                  </button>
                </div>
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
                        className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold transition-all ${
                          isCurrent
                            ? "bg-brand-500 text-white ring-4 ring-brand-500/30 scale-105"
                            : isAnswered
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40"
                            : "border bg-card hover:bg-accent text-foreground"
                        }`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-4 flex flex-wrap gap-4 text-xs font-medium text-muted-foreground border-t pt-3">
                  <span className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-md bg-brand-500" />
                    Current
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-md bg-emerald-500/20 border border-emerald-500/40" />
                    Answered ({answeredCount})
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-md border bg-card" />
                    Remaining ({questions.length - answeredCount})
                  </span>
                </div>
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
            <Card className="border-2 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-brand-500/10 text-brand-600 dark:text-brand-400 border-brand-500/20 text-xs font-bold">
                        Question {currentQIndex + 1}
                      </Badge>
                      {isMultiSelect ? (
                        <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 text-xs font-bold">
                          <CheckSquare className="mr-1 h-3 w-3" /> Multi-select
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Single Choice
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg sm:text-xl font-bold leading-relaxed pt-2">
                      {currentQ.prompt}
                    </CardTitle>
                  </div>
                  <Badge variant="secondary" className="shrink-0 font-mono font-bold text-xs">
                    {currentQ.points} pt{currentQ.points !== 1 ? "s" : ""}
                  </Badge>
                </div>
                {isMultiSelect && (
                  <p className="text-xs text-muted-foreground mt-1">
                    💡 Select all correct answers. Partial credit is awarded.
                  </p>
                )}
              </CardHeader>

              {/* Image for image-type questions */}
              {currentQ.imageUrl && (
                <div className="px-6 pb-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={currentQ.imageUrl}
                    alt="Question illustration"
                    className="rounded-xl border max-h-56 w-full object-contain bg-muted p-2"
                  />
                </div>
              )}

              <CardContent className="space-y-3 pt-2">
                {currentQ.options.map((opt, oIdx) => {
                  const isSelected = answers[currentQ.id]?.includes(oIdx) ?? false;
                  const letter = String.fromCharCode(65 + oIdx);
                  const numKey = oIdx + 1;

                  return (
                    <button
                      key={oIdx}
                      type="button"
                      role={isMultiSelect ? "checkbox" : "radio"}
                      aria-checked={isSelected}
                      onClick={() =>
                        handleOptionSelect(currentQ.id, oIdx, currentQ.type)
                      }
                      className={`group flex w-full items-center justify-between rounded-2xl border-2 p-4 text-left font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.99] ${
                        isSelected
                          ? "border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400 shadow-sm"
                          : "border-border/70 hover:border-brand-500/40 hover:bg-accent/60"
                      }`}
                    >
                      <span className="flex items-center gap-3.5">
                        {/* Option letter label */}
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border text-xs font-bold transition-colors ${
                            isSelected
                              ? "border-brand-500 bg-brand-500 text-white"
                              : "border-border bg-muted/60 group-hover:border-brand-500/40"
                          }`}
                        >
                          {letter}
                        </span>
                        <span className="text-sm sm:text-base leading-snug">{opt}</span>
                      </span>

                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        {/* Keyboard shortcut hint badge */}
                        <span className="hidden md:inline-flex items-center justify-center rounded-md border border-border/80 bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground group-hover:border-brand-500/30">
                          {numKey}
                        </span>

                        {isSelected ? (
                          isMultiSelect ? (
                            <CheckSquare className="h-5 w-5 text-brand-500" />
                          ) : (
                            <CheckCircle2 className="h-5 w-5 text-brand-500" />
                          )
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground/30 group-hover:text-muted-foreground/60" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* ── Navigation Actions ────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <Button
            variant="outline"
            disabled={currentQIndex === 0}
            onClick={() => setCurrentQIndex((prev) => prev - 1)}
            className="gap-2 rounded-xl font-semibold"
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
                className="gap-1.5 text-muted-foreground hover:text-foreground font-semibold rounded-xl"
              >
                Skip <SkipForward className="h-4 w-4" />
              </Button>
            )}

            {isLastQ ? (
              <Button
                onClick={() => void handleSubmitQuiz()}
                disabled={submitting}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20"
              >
                {submitting ? <Spinner className="text-white" /> : <Sparkles className="h-4 w-4" />}
                {submitting ? "Submitting…" : `Submit Quiz (${answeredCount}/${questions.length})`}
              </Button>
            ) : (
              <Button
                onClick={() => setCurrentQIndex((prev) => prev + 1)}
                className="gap-2 bg-brand-500 hover:bg-brand-600 font-bold rounded-xl"
              >
                Next <ArrowRight className="h-4 w-4" />
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="border-t-4 border-t-brand-500 p-8 shadow-xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-xs font-bold text-brand-600 dark:text-brand-400">
            <Zap className="h-4 w-4" /> Ready to Play
          </div>

          <h1 className="font-display text-3xl font-extrabold tracking-tight">{quiz.title}</h1>
          {quiz.description && (
            <p className="mt-3 text-muted-foreground leading-relaxed">{quiz.description}</p>
          )}

          {/* Quick Metrics */}
          <div className="mt-8 grid gap-4 grid-cols-1 sm:grid-cols-3">
            <div className="rounded-2xl border bg-muted/30 p-4 text-center">
              <HelpCircle className="mx-auto mb-2 h-5 w-5 text-brand-500" />
              <p className="font-display text-xl font-bold">{quiz.questionCount}</p>
              <p className="text-xs text-muted-foreground font-medium">Questions</p>
            </div>

            <div className="rounded-2xl border bg-muted/30 p-4 text-center">
              <Clock className="mx-auto mb-2 h-5 w-5 text-brand-500" />
              <p className="font-display text-xl font-bold">
                {formatDuration(quiz.durationSeconds)}
              </p>
              <p className="text-xs text-muted-foreground font-medium">Time Limit</p>
            </div>

            <div className="rounded-2xl border bg-muted/30 p-4 text-center">
              <Coins className="mx-auto mb-2 h-5 w-5 text-amber-500" />
              <p className="font-display text-xl font-bold text-amber-500">
                +{formatCoins(quiz.totalPoints * quiz.coinsPerPoint)}
              </p>
              <p className="text-xs text-muted-foreground font-medium">Max Coins</p>
            </div>
          </div>

          {/* Settings & Rules Breakdown */}
          <div className="mt-6 rounded-2xl border bg-card/60 p-4 space-y-2.5 text-xs font-medium text-muted-foreground">
            <p className="font-bold text-foreground text-xs uppercase tracking-wider mb-2">
              Rules & Features
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-brand-500 shrink-0" />
                <span>Max Attempts: <strong className="text-foreground">{quiz.settings.maxAttempts}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500 shrink-0" />
                <span>Speed bonus enabled (+10% extra coins)</span>
              </div>
              <div className="flex items-center gap-2">
                <Keyboard className="h-4 w-4 text-purple-500 shrink-0" />
                <span>Keyboard shortcuts: <strong className="text-foreground">1-4 / A-D</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Auto-save progress supported</span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Button variant="outline" onClick={() => router.push("/quiz")} className="flex-1 rounded-xl">
              Back to List
            </Button>
            <Button
              onClick={handleStartQuiz}
              className="flex-1 gap-2 bg-brand-500 hover:bg-brand-600 font-bold rounded-xl shadow-lg shadow-brand-500/20"
            >
              <Zap className="h-4 w-4" /> Start Quiz Now
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

