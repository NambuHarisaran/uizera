"use client";

import { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { clientDb } from "@/lib/firebase/client";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  Flame,
  Maximize2,
  Minimize2,
  Play,
  Radio,
  SkipForward,
  StopCircle,
  Trophy,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/shared/spinner";
import { QrCode } from "@/components/shared/qr-code";
import { postJson, unwrap } from "@/lib/fetcher";
import { shortName } from "@/lib/utils";
import { optionStyleFor } from "@/lib/quiz-option-styles";
import type { LiveQuizSession } from "@/types";

export default function AdminLiveQuizStagePage({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const { quizId } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [quizData, setQuizData] = useState<any>(null);
  const [session, setSession] = useState<LiveQuizSession | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
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
        setQuizData(res.data.quiz);
        setSession(res.data.session);
        setQuestions(res.data.questions || []);
        setLeaderboard(res.data.leaderboard || []);
        setAnsweredCount(res.data.answeredCount || 0);
        setOptionCounts(res.data.optionCounts ?? null);
      }
    } catch {
      toast.error("Failed to load live quiz data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [quizId]);

  // Subscribe to live session document in Firestore real-time!
  useEffect(() => {
    const unsub = onSnapshot(
      doc(clientDb(), "liveQuizSessions", quizId),
      (snapshot) => {
        if (snapshot.exists()) {
          setSession(snapshot.data() as LiveQuizSession);
          // Refresh leaderboard on question update
          loadData();
        }
      },
      (err) => {
        console.error("Live session snapshot error:", err);
      }
    );
    return () => unsub();
  }, [quizId]);

  const handleControl = async (action: "start" | "setQuestion" | "toggleAnswer" | "end", questionIndex?: number) => {
    setActionLoading(true);
    try {
      const res = await postJson<{ session: LiveQuizSession }>(
        `/api/admin/live-quiz/${quizId}/control`,
        { action, questionIndex }
      );
      const data = unwrap(res);
      setSession(data.session);
      toast.success(`Stage Action: ${action} applied!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to execute stage command.");
    } finally {
      setActionLoading(false);
    }
  };

  // Track fullscreen state from the browser itself (not just our own button)
  // so pressing Esc or the OS fullscreen shortcut keeps the UI in sync.
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(document.fullscreenElement === stageRef.current);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const enterPresenterMode = async () => {
    try {
      await stageRef.current?.requestFullscreen();
    } catch {
      toast.error("Fullscreen was blocked by the browser.");
    }
  };

  const exitPresenterMode = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
  };

  // Same per-question countdown the participant screen shows — the host
  // presenting to a projector needs to see it too.
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

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner className="h-8 w-8 text-brand-500" />
      </div>
    );
  }

  const currentQIndex = session?.currentQuestionIndex ?? 0;
  const currentQ = questions[currentQIndex];
  const joinUrl =
    typeof window !== "undefined" ? `${window.location.origin}/quiz/${quizId}/live` : "";

  return (
    <div
      ref={stageRef}
      className={
        isFullscreen
          ? "flex h-screen w-screen flex-col overflow-y-auto bg-background p-6 sm:p-10"
          : "container max-w-5xl py-8 space-y-8"
      }
    >
      {isFullscreen ? (
        <PresenterView
          quizTitle={quizData?.title}
          sessionStatus={session?.status ?? "waiting"}
          joinUrl={joinUrl}
          currentQ={currentQ}
          currentQIndex={currentQIndex}
          totalQuestions={questions.length}
          answeredCount={answeredCount}
          optionCounts={optionCounts}
          timeLeft={timeLeft}
          revealAnswer={Boolean(session?.revealAnswer)}
          actionLoading={actionLoading}
          onExit={exitPresenterMode}
          onStart={() => handleControl("start")}
          onPrev={() => handleControl("setQuestion", currentQIndex - 1)}
          onNext={() => handleControl("setQuestion", currentQIndex + 1)}
          onToggleAnswer={() => handleControl("toggleAnswer")}
          onEnd={() => handleControl("end")}
          canGoPrev={currentQIndex > 0}
          isLastQuestion={currentQIndex >= questions.length - 1}
        />
      ) : (
        <>
      {/* Top stage header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
        <div>
          <Button variant="ghost" size="sm" onClick={() => router.push("/admin/quizzes")} className="gap-2 mb-2">
            <ArrowLeft className="h-4 w-4" /> Admin Quizzes
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl font-extrabold">{quizData?.title || "Live Quiz"}</h1>
            <Badge className="bg-uipath-orange text-white uppercase text-xs animate-pulse">
              Live Stage
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {session?.status === "waiting" && (
            <Button
              onClick={() => handleControl("start")}
              disabled={actionLoading}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              <Play className="h-4 w-4" /> Start Stage Quiz
            </Button>
          )}

          {session?.status !== "ended" && (
            <Button
              onClick={enterPresenterMode}
              variant="outline"
              className="gap-2 font-bold"
            >
              <Maximize2 className="h-4 w-4" /> Present Fullscreen
            </Button>
          )}

          {session?.status === "active" && (
            <Button
              onClick={() => handleControl("end")}
              disabled={actionLoading}
              variant="destructive"
              className="gap-2 font-bold"
            >
              <StopCircle className="h-4 w-4" /> End Live Stage
            </Button>
          )}
        </div>
      </div>

      {/* Stage Controller Grid */}
      <div className="grid gap-6 md:grid-cols-12">
        {/* Left: Active Question Stage Control */}
        <Card className="md:col-span-8 border-2 border-brand-500/30">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Flame className="h-5 w-5 text-uipath-orange" /> Stage Control Panel
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                <span>Question {currentQIndex + 1} of {questions.length}</span>
                {session?.status === "active" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand-500/10 px-2 py-0.5 text-[11px] font-bold text-brand-600 dark:text-brand-400">
                    <Users className="h-3 w-3" /> {answeredCount} answered
                  </span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleControl("toggleAnswer")}
                disabled={actionLoading || session?.status !== "active"}
                className="gap-1.5 text-xs font-bold"
              >
                {session?.revealAnswer ? (
                  <>
                    <EyeOff className="h-4 w-4 text-amber-500" /> Hide Answer
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 text-emerald-500" /> Reveal Answer
                  </>
                )}
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {currentQ ? (
              <div className="space-y-4">
                <div className="rounded-2xl border bg-muted/30 p-6">
                  <span className="font-mono text-xs font-bold text-brand-500 uppercase tracking-wider">
                    Question {currentQIndex + 1}
                  </span>
                  <h3 className="font-display text-2xl font-bold mt-2 leading-tight">
                    {currentQ.prompt}
                  </h3>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {currentQ.options?.map((opt: string, oIdx: number) => {
                      const isRevealed = session?.revealAnswer;
                      const total = optionCounts ? optionCounts.reduce((s, c) => s + c, 0) : 0;
                      const count = optionCounts?.[oIdx] ?? 0;
                      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                      return (
                        <div
                          key={oIdx}
                          className={`relative overflow-hidden rounded-xl border p-4 font-medium transition-all ${
                            isRevealed
                              ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold"
                              : "bg-card"
                          }`}
                        >
                          {optionCounts && (
                            <span
                              className="absolute inset-y-0 left-0 bg-brand-500/10"
                              style={{ width: `${pct}%` }}
                            />
                          )}
                          <div className="relative flex items-center justify-between gap-2">
                            <span>{opt}</span>
                            <div className="flex shrink-0 items-center gap-2">
                              {optionCounts && (
                                <span className="text-xs font-mono text-muted-foreground">
                                  {count} · {pct}%
                                </span>
                              )}
                              {isRevealed && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Stage Stepper Buttons */}
                <div className="flex items-center justify-between pt-2">
                  <Button
                    variant="outline"
                    disabled={session?.status !== "active" || currentQIndex === 0 || actionLoading}
                    onClick={() => handleControl("setQuestion", currentQIndex - 1)}
                  >
                    Previous Question
                  </Button>

                  <div className="flex items-center gap-2">
                    {currentQIndex < questions.length - 1 ? (
                      <Button
                        onClick={() => handleControl("setQuestion", currentQIndex + 1)}
                        disabled={session?.status !== "active" || actionLoading}
                        className="gap-2 bg-brand-500 hover:bg-brand-600 font-bold"
                      >
                        Next Question <SkipForward className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleControl("end")}
                        disabled={session?.status !== "active" || actionLoading}
                        className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                      >
                        <Trophy className="h-4 w-4" /> Show Final Leaderboard
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                No questions configured for this quiz.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: Live Leaderboard & Stage Info */}
        <div className="md:col-span-4 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" /> Stage Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {leaderboard.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Waiting for participant submissions...
                </p>
              ) : (
                leaderboard.map((item, idx) => (
                  <div
                    key={item.uid}
                    className="flex items-center justify-between rounded-xl border bg-muted/20 p-3 text-xs"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="shrink-0 font-bold font-mono text-muted-foreground">#{idx + 1}</span>
                      <span
                        className="truncate font-semibold text-foreground"
                        title={item.displayName}
                      >
                        {shortName(item.displayName)}
                      </span>
                    </div>
                    <span className="shrink-0 font-mono font-bold text-amber-500">{item.score} pts</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="bg-uipath-orange/10 border-uipath-orange/30">
            <CardContent className="p-4 space-y-3">
              <h4 className="font-bold text-sm text-uipath-orange flex items-center gap-1.5">
                <Users className="h-4 w-4" /> Student Stage Link
              </h4>
              <p className="text-xs text-muted-foreground">
                Share this link, or have students scan the QR to join:
              </p>
              {joinUrl && (
                <div className="flex justify-center rounded-lg bg-white p-3">
                  <QrCode value={joinUrl} size={140} />
                </div>
              )}
              <div className="rounded-lg bg-background p-2 text-[11px] font-mono select-all truncate border">
                {joinUrl || `/quiz/${quizId}/live`}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
        </>
      )}
    </div>
  );
}

interface PresenterViewProps {
  quizTitle: string | undefined;
  sessionStatus: "waiting" | "active" | "ended";
  joinUrl: string;
  currentQ: any;
  currentQIndex: number;
  totalQuestions: number;
  answeredCount: number;
  optionCounts: number[] | null;
  timeLeft: number | null;
  revealAnswer: boolean;
  actionLoading: boolean;
  onExit: () => void;
  onStart: () => void;
  onPrev: () => void;
  onNext: () => void;
  onToggleAnswer: () => void;
  onEnd: () => void;
  canGoPrev: boolean;
  isLastQuestion: boolean;
}

/** Projector-friendly host view, à la Kahoot/Menti — big prompt, big answer
 * tiles, minimal floating controls. Rendered inside the same fullscreen'd
 * container as the normal console so the Fullscreen API's target element
 * never gets unmounted mid-toggle. */
function PresenterView({
  quizTitle,
  sessionStatus,
  joinUrl,
  currentQ,
  currentQIndex,
  totalQuestions,
  answeredCount,
  optionCounts,
  timeLeft,
  revealAnswer,
  actionLoading,
  onExit,
  onStart,
  onPrev,
  onNext,
  onToggleAnswer,
  onEnd,
  canGoPrev,
  isLastQuestion,
}: PresenterViewProps) {
  const total = optionCounts ? optionCounts.reduce((s, c) => s + c, 0) : 0;

  if (sessionStatus === "waiting") {
    return (
      <div className="flex h-full flex-1 flex-col items-center justify-center gap-8 text-center">
        <div className="flex items-center gap-3">
          <Radio className="h-6 w-6 text-uipath-orange animate-pulse" />
          <h1 className="font-display text-2xl font-bold sm:text-3xl">
            {quizTitle || "Live Stage Quiz"}
          </h1>
        </div>
        <p className="font-mono text-sm font-bold uppercase tracking-widest text-muted-foreground">
          Scan to join the stage
        </p>
        {joinUrl && (
          <div className="rounded-2xl bg-white p-6 shadow-lg">
            <QrCode value={joinUrl} size={280} />
          </div>
        )}
        <p className="max-w-md break-all font-mono text-sm text-muted-foreground">{joinUrl}</p>
        <Button
          onClick={onStart}
          disabled={actionLoading}
          size="lg"
          className="gap-2 bg-emerald-600 px-8 text-white hover:bg-emerald-700 font-bold"
        >
          <Play className="h-5 w-5" /> Start Stage Quiz
        </Button>
        <Button variant="ghost" size="sm" onClick={onExit} className="gap-1.5">
          <Minimize2 className="h-4 w-4" /> Exit Fullscreen
        </Button>
      </div>
    );
  }

  if (sessionStatus === "ended") {
    return (
      <div className="flex h-full flex-1 flex-col items-center justify-center gap-4 text-center">
        <Trophy className="h-16 w-16 text-amber-500" />
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Live Stage Ended</h1>
        <p className="text-muted-foreground">Exit fullscreen to review the final leaderboard.</p>
        <Button variant="outline" onClick={onExit} className="gap-1.5">
          <Minimize2 className="h-4 w-4" /> Exit Fullscreen
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-1 flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Radio className="h-6 w-6 shrink-0 text-uipath-orange animate-pulse" />
          <h1 className="max-w-md truncate font-display text-xl font-bold sm:text-2xl">
            {quizTitle || "Live Stage Quiz"}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 rounded-full bg-brand-500/10 px-3 py-1.5 text-sm font-bold text-brand-600 dark:text-brand-400">
            <Users className="h-4 w-4" /> {answeredCount} answered
          </span>
          {timeLeft !== null && (
            <span
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-sm font-bold ${
                timeLeft <= 5
                  ? "border-red-500/40 bg-red-500/10 text-red-500 animate-pulse"
                  : "border-uipath-orange/40 bg-uipath-orange/10 text-uipath-orange"
              }`}
            >
              <Clock className="h-4 w-4" /> {timeLeft}s
            </span>
          )}
          <Button variant="outline" size="sm" onClick={onExit} className="gap-1.5">
            <Minimize2 className="h-4 w-4" /> Exit
          </Button>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-8 py-8">
        <span className="font-mono text-sm font-bold uppercase tracking-widest text-muted-foreground">
          Question {currentQIndex + 1} of {totalQuestions}
        </span>

        {currentQ ? (
          <>
            <h2 className="max-w-4xl text-center font-display text-3xl font-extrabold leading-tight sm:text-5xl">
              {currentQ.prompt}
            </h2>

            <div className="grid w-full max-w-4xl gap-4 sm:grid-cols-2">
              {currentQ.options?.map((opt: string, oIdx: number) => {
                const style = optionStyleFor(oIdx);
                const Icon = style.icon;
                const count = optionCounts?.[oIdx] ?? 0;
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div
                    key={oIdx}
                    className={`relative flex items-center gap-4 overflow-hidden rounded-2xl border-2 p-6 shadow-lg ${style.border} ${style.bg} ${style.text}`}
                  >
                    {optionCounts && (
                      <span
                        className="absolute inset-y-0 left-0 bg-black/15"
                        style={{ width: `${pct}%` }}
                      />
                    )}
                    <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/10">
                      <Icon className="h-6 w-6" />
                    </span>
                    <span className="relative flex-1 text-lg font-bold sm:text-xl">{opt}</span>
                    {optionCounts && (
                      <span className="relative shrink-0 font-mono text-base font-bold">{count}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <p className="text-lg text-muted-foreground">No question loaded.</p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 border-t pt-6">
        <Button variant="outline" disabled={!canGoPrev || actionLoading} onClick={onPrev}>
          Previous
        </Button>
        <Button
          variant="outline"
          onClick={onToggleAnswer}
          disabled={actionLoading}
          className="gap-1.5 font-bold"
        >
          {revealAnswer ? (
            <EyeOff className="h-4 w-4 text-amber-500" />
          ) : (
            <Eye className="h-4 w-4 text-emerald-500" />
          )}
          {revealAnswer ? "Hide Answer" : "Reveal Answer"}
        </Button>
        {isLastQuestion ? (
          <Button
            onClick={onEnd}
            disabled={actionLoading}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
          >
            <Trophy className="h-4 w-4" /> Show Final Leaderboard
          </Button>
        ) : (
          <Button
            onClick={onNext}
            disabled={actionLoading}
            className="gap-2 bg-brand-500 hover:bg-brand-600 font-bold"
          >
            Next Question <SkipForward className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
