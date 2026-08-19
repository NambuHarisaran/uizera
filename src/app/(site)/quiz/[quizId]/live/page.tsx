"use client";

import { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/layout/logo";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Coins,
  LogIn,
  Radio,
  Sparkles,
  Timer,
  Trophy,
  UserX,
  Users,
  XCircle,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/shared/spinner";
import { postJson, unwrap } from "@/lib/fetcher";
import { shortName } from "@/lib/utils";
import { OPTION_STYLES, optionStyleFor } from "@/lib/quiz-option-styles";
import { useAuth } from "@/components/providers/auth-provider";
import type { LiveQuizSession } from "@/types";

interface AnswerRecord {
  selected: number[];
  // correct and points are undefined until the host reveals the answer.
  // Never trust values injected client-side before reveal — the server
  // does not send them in the submit response to prevent cheating.
  correct?: boolean;
  points?: number;
}

function playClickSound() {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(520, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.06);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.06);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.06);
  } catch {}
}

export default function ParticipantLiveQuizPage({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const { quizId } = use(params);
  const router = useRouter();
  const { user, loading: authLoading, signInWithGoogle } = useAuth();

  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
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
  const [isKicked, setIsKicked] = useState(false);

  const prevQuestionIndexRef = useRef<number | null>(null);

  // Register in lobby on join
  const joinLobby = async () => {
    try {
      const res = await postJson<{ kicked: boolean }>(`/api/live-quiz/${quizId}/join`, {});
      const data = unwrap(res);
      if (data.kicked) setIsKicked(true);
    } catch {
      // Best effort join
    }
  };

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
        if (res.data.isKicked) setIsKicked(true);
      }
    } catch (err) {
      console.error("Failed to load live quiz data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      joinLobby();
      loadData();
    } else if (!authLoading) {
      // Unauthenticated: stop loading spinner so the login screen renders immediately!
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId, user, authLoading]);

  // Fast real-time polling (750ms) for snappy Kahoot-style live response
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      void loadData();
    }, 750);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId, user]);

  const currentQIndex = session?.currentQuestionIndex ?? 0;
  const currentQ = questions[currentQIndex];
  const isEnded = session?.status === "ended";
  const isWaiting = session?.status === "waiting" || session?.viewState === "lobby";
  const isLeaderboard = session?.viewState === "leaderboard";
  const myAnswerForCurrent = currentQ ? myAnswers[currentQ.id] : undefined;
  const isRevealed = Boolean(session?.revealAnswer);
  const totalAnswered = optionCounts ? optionCounts.reduce((s, c) => s + c, 0) : 0;

  // Countdown timer synced from server questionStartAtMs
  useEffect(() => {
    if (!session || session.status !== "active" || !session.questionStartAtMs || isLeaderboard) {
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
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [session?.questionStartAtMs, session?.questionDurationSeconds, session?.status, isLeaderboard]);

  const handleSelect = async (questionId: string, optionIdx: number) => {
    if (myAnswers[questionId] || isRevealed || submittingQ || isKicked) return;

    // ⚡ 1. Instant optimistic locking for 0ms lag on mobile/desktop
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try { navigator.vibrate(30); } catch {}
    }
    playClickSound();
    setMyAnswers((prev) => ({
      ...prev,
      [questionId]: { selected: [optionIdx] },
    }));
    setSubmittingQ(questionId);

    try {
      const res = await postJson<{ received: boolean; totalScore: number }>(
        `/api/live-quiz/${quizId}/answer`,
        { questionId, questionIndex: currentQIndex, selected: [optionIdx] }
      );
      const data = unwrap(res);
      setMyScore(data.totalScore);
    } catch (err) {
      // Revert only if network submission critically failed
      setMyAnswers((prev) => {
        const next = { ...prev };
        delete next[questionId];
        return next;
      });
      toast.error(err instanceof Error ? err.message : "Could not submit your answer.");
    } finally {
      setSubmittingQ(null);
    }
  };


  const handleGoogleLogin = async () => {
    setSigningIn(true);
    try {
      await signInWithGoogle();
      toast.success("Signed in successfully!");
    } catch (err) {
      toast.error("Google sign-in was cancelled or failed.");
    } finally {
      setSigningIn(false);
    }
  };

  // ── Auth & Loading Spinner ──
  if (authLoading || (loading && user)) {
    return (
      <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center gap-3">
        <Spinner className="h-9 w-9 text-uipath-orange" />
        <p className="text-sm font-semibold text-muted-foreground animate-pulse">Connecting to live stage...</p>
      </div>
    );
  }

  // ── Unauthenticated Screen (Scan QR from phone while logged out) ──
  if (!user) {
    return (
      <div className="container max-w-md py-16 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-2 border-brand-500/30 p-8 text-center space-y-6 shadow-2xl bg-card">
            <Logo
              width={160}
              height={52}
              className="mx-auto"
              imgClassName="mx-auto h-11 w-auto object-contain"
            />

            <div className="inline-flex items-center gap-2 rounded-full border border-uipath-orange/30 bg-uipath-orange/10 px-4 py-1.5 text-xs font-bold text-uipath-orange">
              <Radio className="h-3.5 w-3.5 animate-pulse" /> Live Stage Quiz
            </div>

            <div>
              <h1 className="font-display text-2xl font-extrabold">Join the Stage! 🚀</h1>
              <p className="text-sm text-muted-foreground mt-2 font-medium leading-relaxed">
                Sign in with Google to show your name on the projector screen and compete with your peers in real-time.
              </p>
            </div>

            <Button
              size="lg"
              disabled={signingIn}
              onClick={handleGoogleLogin}
              className="w-full gap-3 h-14 rounded-2xl bg-foreground text-background hover:bg-foreground/90 font-bold text-base shadow-lg transition-all active:scale-95"
            >
              {signingIn ? (
                <Spinner className="h-5 w-5" />
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              {signingIn ? "Signing in..." : "Continue with Google"}
            </Button>

            <p className="text-xs text-muted-foreground pt-2">
              Free to join · Instant live synchronization
            </p>
          </Card>
        </motion.div>
      </div>
    );
  }

  // ── Kicked Screen ──
  if (isKicked) {
    return (
      <div className="container max-w-md py-24 text-center space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <UserX className="h-8 w-8" />
        </div>
        <h1 className="font-display text-2xl font-bold">Removed from Session</h1>
        <p className="text-sm text-muted-foreground">
          You have been removed from this live stage quiz by the presenter.
        </p>
        <Button onClick={() => router.push("/quiz")} className="mt-4 gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Quizzes
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-8 space-y-6 select-none">
      {/* ── Status Header Bar ── */}
      <div className="flex items-center justify-between rounded-2xl border bg-card/80 backdrop-blur-md p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-uipath-orange/15 text-uipath-orange">
            <Radio className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h1 className="font-display text-base sm:text-lg font-bold">{quizData?.title || "Live Stage Quiz"}</h1>
            <p className="text-xs text-muted-foreground">
              {isEnded
                ? "Live Stage Ended"
                : isWaiting
                ? "Stage Lobby"
                : isLeaderboard
                ? "Current Standings"
                : `Question ${currentQIndex + 1} of ${questions.length}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!isEnded && !isWaiting && !isLeaderboard && timeLeft !== null && (
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

          <div className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
            <Coins className="h-3.5 w-3.5" /> {myScore} pts
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* ── 1. WAITING / LOBBY SCREEN (Mentimeter style) ── */}
        {isWaiting && !isEnded && (
          <motion.div
            key="waiting"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <Card className="p-8 sm:p-12 text-center space-y-6 border-2 border-brand-500/30">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-500/10 text-brand-500 ring-8 ring-brand-500/10">
                <Sparkles className="h-10 w-10 text-uipath-orange animate-bounce" />
              </div>

              <div>
                <h2 className="font-display text-2xl sm:text-3xl font-extrabold">You&apos;re In! 🎉</h2>
                <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto font-medium">
                  Look up at the big screen. The presenter will start the quiz shortly.
                </p>
              </div>

              {user && (
                <div className="inline-flex items-center gap-3 rounded-2xl border bg-muted/40 px-5 py-2.5 shadow-sm">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-white font-bold text-sm">
                    {(user.displayName || "M").charAt(0).toUpperCase()}
                  </div>
                  <span className="font-display font-bold text-sm">{user.displayName || "Participant"}</span>
                </div>
              )}

              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-muted-foreground">
                <Spinner className="h-4 w-4 text-uipath-orange" /> Waiting for presenter to start Question 1...
              </div>
            </Card>
          </motion.div>
        )}

        {/* ── 2. ACTIVE QUESTION SCREEN ── */}
        {!isWaiting && !isLeaderboard && !isEnded && (
          <motion.div
            key={`q-${currentQIndex}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="space-y-5"
          >
            <Card className="border-2 border-brand-500/30 shadow-lg p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
                <Badge className="bg-brand-500 text-white text-[11px]">
                  QUESTION {currentQIndex + 1} OF {questions.length}
                </Badge>
                <span className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5" /> {answeredCount} answered
                </span>
              </div>

              <h2 className="font-display text-xl sm:text-2xl font-extrabold leading-snug">
                {currentQ?.prompt}
              </h2>

              {currentQ?.imageUrl && (
                <div className="flex justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={currentQ.imageUrl}
                    alt="Illustration"
                    className="rounded-xl border max-h-48 object-contain bg-muted"
                  />
                </div>
              )}

              {/* Mentimeter Options Grid */}
              <div className="grid gap-3.5 sm:grid-cols-2">
                {currentQ?.options?.map((opt: string, oIdx: number) => {
                  const style = optionStyleFor(oIdx);
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
                      className={`relative flex w-full items-center gap-3.5 overflow-hidden rounded-2xl border-2 p-4 text-left font-bold transition-all duration-200 disabled:cursor-not-allowed ${
                        showResult
                          ? isCorrectOption
                            ? "border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/40"
                            : isSelected
                            ? "border-destructive bg-destructive/15 text-destructive"
                            : "border-border/60 bg-card opacity-50 text-muted-foreground"
                          : isSelected
                          ? `${style.border} ${style.bg} ${style.text} ring-4 ring-brand-500/40 scale-[1.02]`
                          : "border-border/60 bg-card hover:border-brand-500/50 hover:bg-accent text-foreground active:scale-95"
                      }`}
                    >
                      {pct !== null && showResult && (
                        <span
                          className="absolute inset-y-0 left-0 bg-current opacity-10"
                          style={{ width: `${pct}%` }}
                        />
                      )}
                      <span
                        className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                          showResult || isSelected ? "bg-black/10" : style.bg
                        }`}
                      >
                        <Icon className={`h-5 w-5 ${showResult || isSelected ? "" : style.text}`} />
                      </span>
                      <span className="relative flex-1 text-sm sm:text-base font-bold">{opt}</span>
                      {pct !== null && showResult && (
                        <span className="relative shrink-0 font-mono text-xs">{pct}%</span>
                      )}
                      {showResult && isCorrectOption && (
                        <CheckCircle2 className="relative h-5 w-5 shrink-0 text-emerald-500" />
                      )}
                      {showResult && isSelected && !isCorrectOption && (
                        <XCircle className="relative h-5 w-5 shrink-0 text-destructive" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Status Message */}
              {myAnswerForCurrent && !isRevealed && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-brand-500/30 bg-brand-500/10 p-4 text-brand-600 dark:text-brand-400 text-sm font-bold flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="h-5 w-5 animate-pulse" /> Answer locked in! Waiting for the presenter...
                </motion.div>
              )}

              {isRevealed && myAnswerForCurrent && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`rounded-2xl border p-4 text-sm font-bold flex items-center justify-center gap-2 ${
                    myAnswerForCurrent.correct
                      ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                      : myAnswerForCurrent.correct === false
                      ? "border-destructive/40 bg-destructive/15 text-destructive"
                      : "border-amber-500/40 bg-amber-500/15 text-amber-700 dark:text-amber-300"
                  }`}
                >
                  {myAnswerForCurrent.correct === true ? (
                    <>
                      <CheckCircle2 className="h-5 w-5" /> Correct! +{myAnswerForCurrent.points ?? 0} pts ⚡
                    </>
                  ) : myAnswerForCurrent.correct === false ? (
                    <>
                      <XCircle className="h-5 w-5" /> Not quite — 0 pts
                    </>
                  ) : (
                    // correct is undefined = answer was submitted but reveal data
                    // not yet loaded. loadData() is triggered by the Firestore
                    // snapshot and will populate correct/points momentarily.
                    <>
                      <Spinner className="h-4 w-4" /> Loading result...
                    </>
                  )}
                </motion.div>
              )}
            </Card>
          </motion.div>
        )}

        {/* ── 3. INTERMEDIATE / FINAL LEADERBOARD SCREEN ── */}
        {(isLeaderboard || isEnded) && (
          <motion.div
            key="leaderboard"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <Card className="border-t-4 border-t-amber-500 bg-card p-6 sm:p-8 text-center shadow-xl space-y-6">
              <Trophy className="mx-auto h-12 w-12 text-amber-500 animate-bounce" />
              <div>
                <h2 className="font-display text-2xl sm:text-3xl font-extrabold">
                  {isEnded ? "Final Standings 🏆" : "Current Standings"}
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Your Score: <span className="font-bold text-foreground">{myScore} pts</span>
                </p>
              </div>

              <div className="space-y-2.5 text-left">
                {leaderboard.map((item, idx) => (
                  <div
                    key={item.uid}
                    className={`flex items-center justify-between gap-3 rounded-2xl border p-3 text-sm transition-all ${
                      idx === 0
                        ? "border-amber-500/50 bg-amber-500/10 font-bold"
                        : idx === 1
                        ? "border-slate-400/40 bg-slate-400/10 font-semibold"
                        : idx === 2
                        ? "border-amber-700/40 bg-amber-700/10 font-semibold"
                        : "bg-card"
                    } ${item.uid === user?.uid ? "ring-2 ring-brand-500" : ""}`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="shrink-0 font-mono font-bold w-6 text-center text-xs">
                        {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                      </span>
                      <span className="truncate font-display font-semibold" title={item.displayName}>
                        {shortName(item.displayName)}
                      </span>
                      {item.uid === user?.uid && (
                        <Badge variant="secondary" className="bg-brand-500/10 text-brand-600 text-[10px] px-1.5 py-0">
                          You
                        </Badge>
                      )}
                    </div>
                    <span className="shrink-0 font-mono font-bold text-amber-500 flex items-center gap-1">
                      {item.score} <Coins className="h-3.5 w-3.5" />
                    </span>
                  </div>
                ))}
              </div>

              {isEnded && (
                <div className="pt-4">
                  <Button size="lg" onClick={() => router.push("/quiz")} className="w-full rounded-2xl font-bold">
                    Back to All Quizzes
                  </Button>
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
