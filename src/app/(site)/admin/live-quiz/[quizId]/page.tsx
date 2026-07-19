"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { clientDb } from "@/lib/firebase/client";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Crown,
  Eye,
  EyeOff,
  Flame,
  Play,
  RotateCcw,
  SkipForward,
  Sparkles,
  StopCircle,
  Trophy,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/shared/spinner";
import { postJson, unwrap } from "@/lib/fetcher";
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
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch initial data
  const loadData = async () => {
    try {
      const res = await fetch(`/api/live-quiz/${quizId}`).then((r) => r.json());
      if (res.ok) {
        setQuizData(res.data.quiz);
        setSession(res.data.session);
        setQuestions(res.data.questions || []);
        setLeaderboard(res.data.leaderboard || []);
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

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner className="h-8 w-8 text-brand-500" />
      </div>
    );
  }

  const currentQIndex = session?.currentQuestionIndex ?? 0;
  const currentQ = questions[currentQIndex];

  return (
    <div className="container max-w-5xl py-8 space-y-8">
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
              <p className="text-xs text-muted-foreground mt-1">
                Question {currentQIndex + 1} of {questions.length}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleControl("toggleAnswer")}
                disabled={actionLoading}
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
                      return (
                        <div
                          key={oIdx}
                          className={`flex items-center justify-between rounded-xl border p-4 font-medium transition-all ${
                            isRevealed
                              ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold"
                              : "bg-card"
                          }`}
                        >
                          <span>{opt}</span>
                          {isRevealed && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Stage Stepper Buttons */}
                <div className="flex items-center justify-between pt-2">
                  <Button
                    variant="outline"
                    disabled={currentQIndex === 0 || actionLoading}
                    onClick={() => handleControl("setQuestion", currentQIndex - 1)}
                  >
                    Previous Question
                  </Button>

                  <div className="flex items-center gap-2">
                    {currentQIndex < questions.length - 1 ? (
                      <Button
                        onClick={() => handleControl("setQuestion", currentQIndex + 1)}
                        disabled={actionLoading}
                        className="gap-2 bg-brand-500 hover:bg-brand-600 font-bold"
                      >
                        Next Question <SkipForward className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleControl("end")}
                        disabled={actionLoading}
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
                    <div className="flex items-center gap-2">
                      <span className="font-bold font-mono text-muted-foreground">#{idx + 1}</span>
                      <span className="font-semibold text-foreground truncate max-w-[120px]">
                        {item.displayName}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-amber-500">{item.score} pts</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="bg-uipath-orange/10 border-uipath-orange/30">
            <CardContent className="p-4 space-y-2">
              <h4 className="font-bold text-sm text-uipath-orange flex items-center gap-1.5">
                <Users className="h-4 w-4" /> Student Stage Link
              </h4>
              <p className="text-xs text-muted-foreground">
                Share or project this link for live participants:
              </p>
              <div className="rounded-lg bg-background p-2 text-[11px] font-mono select-all truncate border">
                {typeof window !== "undefined" ? `${window.location.origin}/quiz/${quizId}/live` : `/quiz/${quizId}/live`}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
