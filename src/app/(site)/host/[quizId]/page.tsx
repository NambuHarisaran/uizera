"use client";

import { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Coins,
  Crown,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  Play,
  Radio,
  RotateCcw,
  SkipForward,
  StopCircle,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Spinner } from "@/components/shared/spinner";
import { QrCode } from "@/components/shared/qr-code";
import { postJson, unwrap } from "@/lib/fetcher";
import { optionStyleFor } from "@/lib/quiz-option-styles";
import { useAuth } from "@/components/providers/auth-provider";
import type { LiveParticipant, LiveQuizSession } from "@/types";

export default function HostLiveQuizStagePage({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const { quizId } = use(params);
  const router = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [quizData, setQuizData] = useState<any>(null);
  const [session, setSession] = useState<LiveQuizSession | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [participants, setParticipants] = useState<LiveParticipant[]>([]);
  const [answerKey, setAnswerKey] = useState<Record<string, { correct: number[]; explanation: string }> | null>(null);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [optionCounts, setOptionCounts] = useState<number[] | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const stageRef = useRef<HTMLDivElement>(null);

  // Fetch initial data
  const loadData = async () => {
    try {
      const res = await fetch(`/api/live-quiz/${quizId}`).then((r) => r.json());
      if (res.ok) {
        // Authorization check: If user is a quiz_host, verify they are assigned
        if (user?.role === "quiz_host" && res.data.quiz.hostUid !== user.uid) {
          toast.error("You are not authorized to host this quiz.");
          router.push("/host");
          return;
        }
        setQuizData(res.data.quiz);
        setSession(res.data.session);
        setQuestions(res.data.questions || []);
        setAnswerKey(res.data.answerKey || null);
        setLeaderboard(res.data.leaderboard || []);
        setParticipants(res.data.participants || []);
        setAnsweredCount(res.data.answeredCount || 0);
        setOptionCounts(res.data.optionCounts ?? null);
      } else {
        toast.error("Failed to load live quiz data.");
        router.push("/host");
      }
    } catch {
      toast.error("Failed to load live quiz data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId]);

  // Real-time polling against Cloudflare D1 (750ms)
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      void loadData();
    }, 750);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId, user]);



  const handleControl = async (
    action: "start" | "setQuestion" | "toggleAnswer" | "showLeaderboard" | "hideLeaderboard" | "kickParticipant" | "end" | "relaunch",
    questionIndex?: number,
    targetUid?: string
  ) => {
    setActionLoading(true);
    try {
      const res = await postJson<{ session: LiveQuizSession }>(
        `/api/host/live-quiz/${quizId}/control`,
        { action, questionIndex, targetUid }
      );
      const data = unwrap(res);
      setSession(data.session);
      if (action === "kickParticipant") {
        toast.success("Participant removed from stage.");
      } else {
        toast.success(`Action applied: ${action}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to execute command.");
    } finally {
      setActionLoading(false);
    }
  };

  // Fullscreen toggle
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(document.fullscreenElement === stageRef.current);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const enterPresenterMode = async () => {
    try {
      await stageRef.current?.requestFullscreen();
    } catch {
      toast.error("Fullscreen was blocked by browser.");
    }
  };

  const exitPresenterMode = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
  };

  // Per-question countdown timer
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
  }, [session?.questionStartAtMs, session?.questionDurationSeconds, session?.status, session?.currentQuestionIndex]);

  // Keyboard remote control shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (actionLoading) return;

      const currentQIndex = session?.currentQuestionIndex ?? 0;
      const isLeaderboard = session?.viewState === "leaderboard";
      const isEnded = session?.status === "ended";

      if (e.key === "f" || e.key === "F") {
        if (!isFullscreen) enterPresenterMode();
        else exitPresenterMode();
      } else if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        if (session?.status === "waiting") {
          handleControl("start");
        } else if (session?.status === "active" && !isLeaderboard) {
          handleControl("toggleAnswer");
        }
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        if (currentQIndex < questions.length - 1) {
          handleControl("setQuestion", currentQIndex + 1);
        } else if (!isEnded) {
          handleControl("end");
        }
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (currentQIndex > 0) {
          handleControl("setQuestion", currentQIndex - 1);
        }
      } else if (e.key === "l" || e.key === "L") {
        e.preventDefault();
        if (isLeaderboard) handleControl("hideLeaderboard");
        else handleControl("showLeaderboard");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, isFullscreen, actionLoading, questions.length]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner className="h-8 w-8 text-amber-500" />
      </div>
    );
  }

  const currentQIndex = session?.currentQuestionIndex ?? 0;
  const currentQ = questions[currentQIndex];
  const joinUrl =
    typeof window !== "undefined" ? `${window.location.origin}/quiz/${quizId}/live` : "";
  const isWaiting = session?.status === "waiting";
  const isEnded = session?.status === "ended";
  const isLeaderboardView = session?.viewState === "leaderboard";
  const isRevealed = Boolean(session?.revealAnswer);

  return (
    <div
      ref={stageRef}
      className={
        isFullscreen
          ? "flex h-screen w-screen flex-col overflow-y-auto bg-background p-6 sm:p-10 select-none"
          : "max-w-6xl mx-auto py-4 space-y-6"
      }
    >
      {/* ── Top Header / Stage Status Bar ────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          {!isFullscreen && (
            <Button variant="ghost" size="sm" onClick={() => router.push("/host")} className="gap-1.5 mb-2 -ml-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> Back to Host Portal
            </Button>
          )}
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold">{quizData?.title || "Live Stage Quiz"}</h1>
            <Badge className="bg-uipath-orange text-white uppercase text-[11px] font-bold tracking-wide animate-pulse">
              Live Stage
            </Badge>
            <Badge variant="outline" className="gap-1.5 bg-background font-medium">
              <Users className="h-3.5 w-3.5 text-brand-500" /> {participants.length} Joined
            </Badge>
          </div>
        </div>

        {/* Global Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {isWaiting && (
            <Button
              onClick={() => handleControl("start")}
              disabled={actionLoading}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md"
            >
              <Play className="h-4 w-4" /> Start Stage Quiz
            </Button>
          )}

          {!isFullscreen && (
            <Button onClick={enterPresenterMode} variant="outline" className="gap-2 font-bold shadow-sm">
              <Maximize2 className="h-4 w-4" /> Present Fullscreen
            </Button>
          )}

          {isFullscreen && (
            <Button onClick={exitPresenterMode} variant="outline" size="sm" className="gap-1.5 font-bold">
              <Minimize2 className="h-4 w-4" /> Exit Fullscreen
            </Button>
          )}

          {!isEnded && !isWaiting && (
            <Button
              onClick={() => handleControl("end")}
              disabled={actionLoading}
              variant="destructive"
              size={isFullscreen ? "sm" : "default"}
              className="gap-2 font-bold shadow-md"
            >
              <StopCircle className="h-4 w-4" /> End Quiz
            </Button>
          )}

          {isEnded && (
            <Button
              onClick={() => handleControl("relaunch")}
              disabled={actionLoading}
              className="gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-md"
            >
              <RotateCcw className="h-4 w-4" /> Relaunch Session
            </Button>
          )}
        </div>
      </div>

      {/* ── 1. WAITING / LOBBY SCREEN (Clean, balanced QR, Participant Wall, Kickable) ── */}
      {isWaiting && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="grid gap-6 lg:grid-cols-12 items-stretch">
            {/* Left: QR Code + Join Instructions */}
            <Card className="lg:col-span-5 border-2 border-brand-500/20 p-6 text-center bg-card shadow-lg flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 px-3.5 py-1 text-xs font-bold text-brand-600 dark:text-brand-400">
                  <Radio className="h-3.5 w-3.5 animate-pulse text-uipath-orange" /> Stage Lobby Open
                </div>

                <div>
                  <h2 className="font-display text-xl sm:text-2xl font-bold">Scan QR to Join</h2>
                  <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                    Use your phone camera or browser to join instantly.
                  </p>
                </div>

                {joinUrl && (
                  <div className="flex justify-center py-2">
                    <div className="rounded-2xl bg-white p-3.5 shadow-md ring-4 ring-brand-500/10 transition-transform hover:scale-105 duration-200">
                      <QrCode value={joinUrl} size={190} />
                    </div>
                  </div>
                )}

                <div className="rounded-xl border bg-muted/40 px-3 py-2 text-xs font-mono select-all truncate text-foreground font-semibold">
                  {joinUrl}
                </div>
              </div>

              <div className="pt-2">
                <Button
                  size="lg"
                  onClick={() => handleControl("start")}
                  disabled={actionLoading}
                  className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base h-12 rounded-xl shadow-md shadow-emerald-600/20"
                >
                  <Play className="h-5 w-5" /> Start Quiz ({participants.length} Ready)
                </Button>
              </div>
            </Card>

            {/* Right: Live Participants Wall (with Kick capability) */}
            <Card className="lg:col-span-7 border bg-card/60 backdrop-blur-md p-6 flex flex-col justify-between shadow-sm min-h-[420px]">

              <div className="flex items-center justify-between border-b pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-brand-500" />
                  <h3 className="font-display text-lg font-bold">Joined Players</h3>
                </div>
                <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border-emerald-500/30">
                  {participants.length} in Lobby
                </Badge>
              </div>

              <div className="flex-1 overflow-y-auto max-h-[440px] pr-1">
                {participants.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground space-y-3">
                    <Spinner className="h-8 w-8 text-uipath-orange" />
                    <p className="text-sm font-medium">Waiting for players to scan QR and join...</p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2.5">
                    <AnimatePresence>
                      {participants.map((p) => (
                        <motion.div
                          key={p.uid}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.6 }}
                          className="group relative flex items-center gap-2 rounded-2xl border bg-background px-3.5 py-2 text-sm font-semibold shadow-sm transition-all hover:border-destructive/60 hover:bg-destructive/5"
                        >
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-500/15 text-brand-600 font-bold text-xs">
                            {p.displayName.charAt(0).toUpperCase()}
                          </div>
                          <span className="truncate max-w-[130px]">{p.displayName}</span>
                          
                          <button
                            type="button"
                            title="Kick player"
                            onClick={() => handleControl("kickParticipant", undefined, p.uid)}
                            className="opacity-0 group-hover:opacity-100 ml-1 rounded-full p-1 text-destructive hover:bg-destructive/20 transition-opacity"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              <p className="text-[11px] text-muted-foreground mt-4 pt-3 border-t flex items-center justify-between">
                <span>Hover over any player to remove them.</span>
                <span className="font-mono font-semibold">UiZera Stage Host</span>
              </p>
            </Card>
          </div>
        </motion.div>
      )}

      {/* ── 2. ACTIVE QUESTION STAGE ── */}
      {!isWaiting && !isEnded && !isLeaderboardView && (
        <div className="space-y-6">
          <Card className="border-2 border-brand-500/30 shadow-xl overflow-hidden">
            <CardHeader className="bg-muted/20 border-b flex flex-row items-center justify-between pb-4">
              <div className="flex items-center gap-3">
                <Badge className="bg-brand-500 text-white font-bold text-sm">
                  QUESTION {currentQIndex + 1} OF {questions.length}
                </Badge>
                <span className="text-xs font-bold text-muted-foreground">
                  {currentQ?.points} Points
                </span>
              </div>

              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 rounded-full bg-brand-500/10 px-3 py-1 text-xs font-bold text-brand-600 dark:text-brand-400">
                  <Users className="h-3.5 w-3.5" /> {answeredCount} Answered
                </span>

                {timeLeft !== null && (
                  <span
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-sm font-bold ${
                      timeLeft <= 5
                        ? "border-red-500/40 bg-red-500/10 text-red-500 animate-pulse"
                        : "border-uipath-orange/40 bg-uipath-orange/10 text-uipath-orange"
                    }`}
                  >
                    <Clock className="h-3.5 w-3.5" /> {timeLeft}s
                  </span>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-6 sm:p-10 space-y-8">
              {currentQ ? (
                <>
                  <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-center leading-snug">
                    {currentQ.prompt}
                  </h2>

                  {currentQ.imageUrl && (
                    <div className="flex justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={currentQ.imageUrl}
                        alt="Question visual"
                        className="rounded-2xl border max-h-72 object-contain bg-muted"
                      />
                    </div>
                  )}

                  <div className="grid gap-4 sm:grid-cols-2">
                    {currentQ.options?.map((opt: string, oIdx: number) => {
                      const style = optionStyleFor(oIdx);
                      const Icon = style.icon;
                      const isCorrect = answerKey?.[currentQ.id]?.correct?.includes(oIdx);
                      const totalVotes = optionCounts ? optionCounts.reduce((s, c) => s + c, 0) : 0;
                      const count = optionCounts?.[oIdx] ?? 0;
                      const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;

                      const showAsCorrect = isRevealed && isCorrect;
                      const showAsWrong = isRevealed && !isCorrect;

                      return (
                        <div
                          key={oIdx}
                          className={`relative flex items-center gap-4 overflow-hidden rounded-2xl border-2 p-5 font-bold transition-all duration-300 ${
                            showAsCorrect
                              ? "border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/40"
                              : showAsWrong
                              ? "border-border/60 bg-card opacity-50 text-muted-foreground"
                              : `${style.border} ${style.bg} ${style.text}`
                          }`}
                        >
                          {optionCounts && (
                            <motion.span
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.5, ease: "easeOut" }}
                              className={`absolute inset-y-0 left-0 ${showAsCorrect ? "bg-emerald-500/20" : "bg-black/15"}`}
                            />
                          )}

                          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/10">
                            <Icon className="h-5 w-5" />
                          </span>

                          <span className="relative flex-1 text-base sm:text-lg">{opt}</span>

                          {optionCounts && (
                            <span className="relative shrink-0 font-mono text-sm px-2 py-0.5 rounded-lg bg-black/10">
                              {count} ({pct}%)
                            </span>
                          )}

                          {showAsCorrect && (
                            <Badge className="relative bg-emerald-600 text-white font-bold gap-1 border-none shrink-0 text-xs">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Correct
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {isRevealed && answerKey?.[currentQ.id]?.explanation && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-800 dark:text-emerald-200"
                    >
                      <span className="font-bold">Explanation: </span>
                      {answerKey[currentQ.id].explanation}
                    </motion.div>
                  )}
                </>
              ) : (
                <p className="text-center text-muted-foreground py-12">No question loaded.</p>
              )}
            </CardContent>
          </Card>

          {/* Presenter Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-card p-4 shadow-sm">
            <Button
              variant="outline"
              disabled={currentQIndex === 0 || actionLoading}
              onClick={() => handleControl("setQuestion", currentQIndex - 1)}
            >
              Previous Question
            </Button>

            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                variant={isRevealed ? "secondary" : "default"}
                onClick={() => handleControl("toggleAnswer")}
                disabled={actionLoading}
                className="gap-2 font-bold min-w-[150px]"
              >
                {isRevealed ? (
                  <>
                    <EyeOff className="h-4 w-4 text-amber-500" /> Hide Answer
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 text-emerald-400" /> Reveal Answer
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={() => handleControl("showLeaderboard")}
                disabled={actionLoading}
                className="gap-2 font-bold border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
              >
                <Trophy className="h-4 w-4 text-amber-500" /> Show Leaderboard
              </Button>

              {currentQIndex < questions.length - 1 ? (
                <Button
                  onClick={() => handleControl("setQuestion", currentQIndex + 1)}
                  disabled={actionLoading}
                  className="gap-2 bg-brand-500 hover:bg-brand-600 text-white font-bold"
                >
                  Next Question <SkipForward className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={() => handleControl("end")}
                  disabled={actionLoading}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  <Trophy className="h-4 w-4" /> End & Final Scores
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 3. INTERMEDIATE & FINAL LEADERBOARD VIEW ── */}
      {(isLeaderboardView || isEnded) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          <Card className="border-t-4 border-t-amber-500 bg-card p-6 sm:p-10 shadow-2xl text-center">
            <Trophy className="mx-auto mb-3 h-14 w-14 text-amber-500 animate-bounce" />
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold">
              {isEnded ? "Final Stage Leaderboard 🏆" : "Current Standings"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {isEnded ? "Congratulations to all automation champions!" : `Scores after Question ${currentQIndex + 1}`}
            </p>

            {/* Podium (Top 3 Players) */}
            {leaderboard.length >= 3 && (
              <div className="mt-8 grid grid-cols-3 gap-3 max-w-lg mx-auto items-end pt-8 pb-4">
                <div className="flex flex-col items-center">
                  <div className="h-10 w-10 rounded-full bg-slate-300 text-slate-800 font-extrabold flex items-center justify-center text-sm shadow-md mb-2">
                    🥈
                  </div>
                  <span className="font-bold text-sm truncate max-w-[100px]">{leaderboard[1]?.displayName}</span>
                  <span className="font-mono text-xs font-bold text-amber-500">{leaderboard[1]?.score} pts</span>
                  <div className="mt-2 h-20 w-full rounded-t-xl bg-slate-400/20 border-t-2 border-slate-400 flex items-center justify-center font-extrabold text-slate-500">
                    #2
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <Crown className="h-8 w-8 text-amber-400 animate-pulse mb-1" />
                  <div className="h-12 w-12 rounded-full bg-amber-400 text-amber-950 font-black flex items-center justify-center text-base shadow-lg mb-2 ring-4 ring-amber-400/30">
                    🥇
                  </div>
                  <span className="font-extrabold text-base truncate max-w-[120px]">{leaderboard[0]?.displayName}</span>
                  <span className="font-mono text-sm font-extrabold text-amber-500">{leaderboard[0]?.score} pts</span>
                  <div className="mt-2 h-28 w-full rounded-t-xl bg-amber-500/25 border-t-2 border-amber-500 flex items-center justify-center font-black text-amber-500 text-lg">
                    #1
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <div className="h-10 w-10 rounded-full bg-amber-700 text-amber-100 font-extrabold flex items-center justify-center text-sm shadow-md mb-2">
                    🥉
                  </div>
                  <span className="font-bold text-sm truncate max-w-[100px]">{leaderboard[2]?.displayName}</span>
                  <span className="font-mono text-xs font-bold text-amber-500">{leaderboard[2]?.score} pts</span>
                  <div className="mt-2 h-14 w-full rounded-t-xl bg-amber-700/20 border-t-2 border-amber-700 flex items-center justify-center font-extrabold text-amber-700">
                    #3
                  </div>
                </div>
              </div>
            )}

            {/* Leaderboard Table */}
            <div className="mt-6 space-y-2.5 max-w-xl mx-auto text-left">
              {leaderboard.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">No responses recorded yet.</p>
              ) : (
                leaderboard.map((item, idx) => (
                  <div
                    key={item.uid}
                    className={`flex items-center justify-between gap-3 rounded-2xl border p-3.5 transition-all ${
                      idx === 0
                        ? "border-amber-500/50 bg-amber-500/10 font-bold"
                        : idx === 1
                        ? "border-slate-400/40 bg-slate-400/10 font-semibold"
                        : idx === 2
                        ? "border-amber-700/40 bg-amber-700/10 font-semibold"
                        : "bg-card"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="font-mono text-sm font-bold w-6 text-center text-muted-foreground">
                        #{idx + 1}
                      </span>
                      <span className="truncate font-display text-sm sm:text-base font-semibold">{item.displayName}</span>
                    </div>
                    <span className="font-mono text-sm font-bold text-amber-500 flex items-center gap-1">
                      {item.score} <Coins className="h-3.5 w-3.5" />
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Navigation from Leaderboard */}
            <div className="mt-8 flex justify-center gap-3">
              {!isEnded && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => handleControl("hideLeaderboard")}
                    className="gap-2 font-bold"
                  >
                    Back to Question
                  </Button>
                  {currentQIndex < questions.length - 1 ? (
                    <Button
                      onClick={() => handleControl("setQuestion", currentQIndex + 1)}
                      className="gap-2 bg-brand-500 hover:bg-brand-600 text-white font-bold"
                    >
                      Next Question <SkipForward className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleControl("end")}
                      className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                    >
                      <Trophy className="h-4 w-4" /> End & Final Scores
                    </Button>
                  )}
                </>
              )}
              {isEnded && (
                <Button
                  onClick={() => router.push("/host")}
                  className="gap-2 bg-brand-500 hover:bg-brand-600 text-white font-bold"
                >
                  <ArrowLeft className="h-4 w-4" /> Back to Host Portal
                </Button>
              )}
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
