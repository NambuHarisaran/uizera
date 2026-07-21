"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { clientDb } from "@/lib/firebase/client";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  CheckCircle2,
  Coins,
  Radio,
  Timer,
  Trophy,
  Users,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/shared/spinner";
import { postJson, unwrap } from "@/lib/fetcher";
import { shortName } from "@/lib/utils";
import { OPTION_STYLES } from "@/lib/quiz-option-styles";
import { useAuth } from "@/components/providers/auth-provider";
import type { LiveQuizSession } from "@/types";

interface AnswerRecord {
  selected: number[];
  correct: boolean;
  points: number;
}

export default function ParticipantLiveQuizPage({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const { quizId } = use(params);
  const router = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<LiveQuizSession | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [quizData, setQuizData] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [myAnswers, setMyAnswers] = useState<Record<string, AnswerRecord>>({});
  const [myScore, setMyScore] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [optionCounts, setOptionCounts] = useState<number[] | null>(null);
  const [revealedCorrect, setRevealedCorrect] = useState<number[] | null>(null);
  const [submittingQ, setSubmittingQ] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const loadData = async () => {
    try {
      const res = await fetch(`/api/live-quiz/${quizId}`).then((r) => r.json());
      if (res.ok) {
        setQuizData(res.data.quiz);
        setSession(res.data.session);
        setQuestions(res.data.questions || []);
        setLeaderboard(res.data.leaderboard || []);
        setMyAnswers(res.data.myAnswers || {});
        setMyScore(res.data.myScore || 0);
        setAnsweredCount(res.data.answeredCount || 0);
        setOptionCounts(res.data.optionCounts ?? null);
        setRevealedCorrect(res.data.revealedCorrect ?? null);
      }
    } catch (err) {
      console.error("Failed to load live quiz data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId, user]);

  // Real-time Firestore snapshot listener for INSTANT screen synchronization!
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(
      doc(clientDb(), "liveQuizSessions", quizId),
      () => {
        loadData();
      },
      (err) => {
        console.error("Live sync snapshot error:", err);
      }
    );
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId, user]);

  const currentQIndex = session?.currentQuestionIndex ?? 0;
  const currentQ = questions[currentQIndex];
  const isEnded = session?.status === "ended";
  const isWaiting = session?.status === "waiting";
  const myAnswerForCurrent = currentQ ? myAnswers[currentQ.id] : undefined;
  const isRevealed = Boolean(session?.revealAnswer);
  const totalAnswered = optionCounts ? optionCounts.reduce((s, c) => s + c, 0) : 0;

  // Per-question countdown, synced off the server's questionStartAtMs so
  // every screen counts down from the same instant regardless of local clock.
  useEffect(() => {
    if (!session || session.status !== "active" || !session.questionStartAtMs) {
      setTimeLeft(null);
      return;
    }
    const durationMs = (session.questionDurationSeconds || 30) * 1000;
    const tick = () => {
      const remain = Math.max(
        0,
        Math.ceil((session.questionStartAtMs + durationMs - Date.now()) / 1000)
      );
      setTimeLeft(remain);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [session?.questionStartAtMs, session?.questionDurationSeconds, session?.status]);

  const handleSelect = async (questionId: string, optionIdx: number) => {
    if (myAnswers[questionId] || isRevealed || submittingQ) return;

    setSubmittingQ(questionId);
    try {
      const res = await postJson<{ isCorrect: boolean; pointsEarned: number; totalScore: number }>(
        `/api/live-quiz/${quizId}/answer`,
        { questionId, questionIndex: currentQIndex, selected: [optionIdx] }
      );
      const data = unwrap(res);
      setMyAnswers((prev) => ({
        ...prev,
        [questionId]: { selected: [optionIdx], correct: data.isCorrect, points: data.pointsEarned },
      }));
      setMyScore(data.totalScore);
      toast.success(
        data.isCorrect ? `Locked in! +${data.pointsEarned} coins ⚡` : "Locked in!"
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit your answer.");
    } finally {
      setSubmittingQ(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Spinner className="h-8 w-8 text-brand-500" />
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-12 space-y-6">
      {/* Header Badge */}
      <div className="flex items-center justify-between rounded-xl border bg-card/80 backdrop-blur-md p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-uipath-orange/15 text-uipath-orange">
            <Radio className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold">{quizData?.title || "Live Stage Quiz"}</h1>
            <p className="text-xs text-muted-foreground">
              {isEnded ? "Live Stage Ended" : `Question ${currentQIndex + 1} of ${questions.length}`}
            </p>
          </div>
        </div>

        {!isEnded && !isWaiting && timeLeft !== null && (
          <div
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-sm font-bold ${
              timeLeft <= 5
                ? "border-red-500/40 bg-red-500/10 text-red-500 animate-pulse"
                : "border-uipath-orange/40 bg-uipath-orange/10 text-uipath-orange"
            }`}
          >
            <Timer className="h-4 w-4" /> {timeLeft}s
          </div>
        )}

        <Badge className="bg-uipath-orange text-white uppercase text-xs animate-pulse">
          LIVE STAGE MODE
        </Badge>
      </div>

      <AnimatePresence mode="wait">
        {isEnded ? (
          /* Live Stage Final Leaderboard Screen */
          <motion.div
            key="leaderboard"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <Card className="border-t-4 border-t-amber-500 bg-card p-8 text-center shadow-xl">
              <Trophy className="mx-auto mb-4 h-16 w-16 text-amber-500 animate-bounce" />
              <h2 className="font-display text-3xl font-extrabold">Live Stage Leaderboard</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Final standings for {quizData?.title} · You scored{" "}
                <span className="font-bold text-foreground flex items-center justify-center gap-1 mt-1">
                  {myScore} <Coins className="h-4 w-4 text-amber-500" />
                </span>
              </p>

              <div className="mt-8 space-y-3">
                {leaderboard.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6">No entries recorded.</p>
                ) : (
                  leaderboard.map((item, idx) => (
                    <div
                      key={item.uid}
                      className={`flex items-center justify-between gap-3 rounded-2xl border p-4 transition-all ${
                        idx === 0
                          ? "border-amber-500/50 bg-amber-500/10 font-bold"
                          : idx === 1
                          ? "border-slate-400/40 bg-slate-400/10 font-semibold"
                          : idx === 2
                          ? "border-amber-700/40 bg-amber-700/10 font-semibold"
                          : "bg-card/60"
                      } ${item.uid === user?.uid ? "ring-2 ring-brand-500" : ""}`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="shrink-0 font-mono text-lg font-extrabold w-6 text-center">
                          {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                        </span>
                        <span
                          className="truncate font-display text-base text-foreground"
                          title={item.displayName}
                        >
                          {shortName(item.displayName)}
                        </span>
                        {item.uid === user?.uid && (
                          <Badge variant="secondary" className="bg-brand-500/10 text-brand-600">You</Badge>
                        )}
                      </div>
                      <span className="shrink-0 font-mono text-base font-extrabold text-amber-500 flex items-center gap-1">
                        {item.score} <Coins className="h-4 w-4" />
                      </span>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <div className="flex justify-center">
              <Button size="lg" onClick={() => router.push("/quiz")} className="rounded-full">
                Back to All Quizzes
              </Button>
            </div>
          </motion.div>
        ) : isWaiting ? (
          /* Waiting Screen */
          <motion.div
            key="waiting"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-8 flex flex-col gap-4 overflow-hidden"
          >
            <Card className="p-12 text-center space-y-4">
              <Image
                src="/uizera-logo.png"
                alt="UiZera"
                width={160}
                height={54}
                className="mx-auto mb-4"
              />
              <Spinner className="mx-auto h-10 w-10 text-uipath-orange" />
              <h2 className="font-display text-2xl font-bold">Waiting for Instructor to Start</h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Get ready! The instructor will start the live stage quiz shortly. Your screen will sync automatically.
              </p>
            </Card>
          </motion.div>
        ) : (
          /* Synchronized Question Screen */
          <motion.div
            key={`q-${currentQIndex}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <Card className="border-2 border-brand-500/30 shadow-lg p-6 sm:p-8">
              <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground mb-4">
                <span>STAGE QUESTION {currentQIndex + 1} OF {questions.length}</span>
                <span className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-muted-foreground/80">
                    <Users className="h-3.5 w-3.5" /> {answeredCount} answered
                  </span>
                  <span className="text-uipath-orange font-bold flex items-center gap-1">
                    <Radio className="h-3.5 w-3.5" /> Synchronized
                  </span>
                </span>
              </div>

              <h2 className="font-display text-2xl font-extrabold sm:text-3xl leading-snug">
                {currentQ?.prompt}
              </h2>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {currentQ?.options?.map((opt: string, oIdx: number) => {
                  const style = OPTION_STYLES[oIdx % OPTION_STYLES.length]!;
                  const Icon = style.icon;
                  const isSelected = myAnswerForCurrent?.selected.includes(oIdx);
                  const isCorrectOption = revealedCorrect?.includes(oIdx);
                  const showResult = isRevealed && revealedCorrect !== null;
                  const pct =
                    optionCounts && totalAnswered > 0
                      ? Math.round(((optionCounts[oIdx] ?? 0) / totalAnswered) * 100)
                      : null;

                  return (
                    <button
                      key={oIdx}
                      type="button"
                      disabled={Boolean(myAnswerForCurrent) || isRevealed || submittingQ === currentQ.id}
                      onClick={() => handleSelect(currentQ.id, oIdx)}
                      className={`relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border-2 p-4 text-left font-bold transition-all disabled:cursor-not-allowed ${
                        showResult
                          ? isCorrectOption
                            ? "border-emerald-500 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            : isSelected
                            ? "border-red-500 bg-red-500/15 text-red-500"
                            : "border-border/60 bg-card opacity-60"
                          : isSelected
                          ? `${style.border} ${style.bg} ${style.text} ring-2 ring-offset-2 ring-offset-background ring-brand-500/40`
                          : "border-border/60 bg-card hover:border-brand-500/50 hover:bg-accent"
                      }`}
                    >
                      {pct !== null && (
                        <span
                          className="absolute inset-y-0 left-0 bg-current opacity-10"
                          style={{ width: `${pct}%` }}
                        />
                      )}
                      <span
                        className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                          showResult || isSelected ? "bg-black/10" : style.bg
                        }`}
                      >
                        <Icon className={`h-4 w-4 ${showResult || isSelected ? "" : style.text}`} />
                      </span>
                      <span className="relative flex-1 text-base">{opt}</span>
                      {pct !== null && <span className="relative shrink-0 font-mono text-sm">{pct}%</span>}
                      {showResult && isCorrectOption && (
                        <CheckCircle2 className="relative h-5 w-5 shrink-0 text-emerald-500" />
                      )}
                      {showResult && isSelected && !isCorrectOption && (
                        <XCircle className="relative h-5 w-5 shrink-0 text-red-500" />
                      )}
                    </button>
                  );
                })}
              </div>

              {myAnswerForCurrent && !isRevealed && (
                <div className="mt-6 rounded-xl border border-brand-500/30 bg-brand-500/10 p-4 text-brand-600 dark:text-brand-400 text-sm font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" /> Answer locked in — waiting for the instructor.
                </div>
              )}

              {!myAnswerForCurrent && isRevealed && (
                <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-600 dark:text-amber-400 text-sm font-semibold flex items-center gap-2">
                  <XCircle className="h-5 w-5" /> Time's up — no answer submitted for this question.
                </div>
              )}

              {isRevealed && myAnswerForCurrent && (
                <div
                  className={`mt-6 rounded-xl border p-4 text-sm font-semibold flex items-center gap-2 ${
                    myAnswerForCurrent.correct
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "border-red-500/30 bg-red-500/10 text-red-500"
                  }`}
                >
                  {myAnswerForCurrent.correct ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 animate-bounce" /> Correct! +{myAnswerForCurrent.points} coins ⚡
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5" /> Not quite — 0 coins
                    </>
                  )}
                </div>
              )}
            </Card>

            <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1">
              Your live score: <span className="font-bold text-foreground">{myScore}</span> <Coins className="h-3.5 w-3.5 text-amber-500" />
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
