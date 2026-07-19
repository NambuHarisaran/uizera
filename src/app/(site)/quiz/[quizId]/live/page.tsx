"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { clientDb } from "@/lib/firebase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Crown,
  Flame,
  HelpCircle,
  Radio,
  Sparkles,
  Trophy,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/shared/spinner";
import { postJson, unwrap } from "@/lib/fetcher";
import { formatCoins } from "@/lib/utils";
import type { LiveQuizSession } from "@/types";

export default function ParticipantLiveQuizPage({
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
  const [selectedOptions, setSelectedOptions] = useState<Record<string, number>>({});
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  // Fetch initial quiz data & leaderboard
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
      toast.error("Failed to load live stage quiz.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [quizId]);

  // Real-time Firestore snapshot listener for INSTANT screen synchronization!
  useEffect(() => {
    const unsub = onSnapshot(
      doc(clientDb(), "liveQuizSessions", quizId),
      (snapshot) => {
        if (snapshot.exists()) {
          const newSession = snapshot.data() as LiveQuizSession;
          setSession(newSession);
          loadData();
        }
      },
      (err) => {
        console.error("Live sync snapshot error:", err);
      }
    );
    return () => unsub();
  }, [quizId]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner className="h-8 w-8 text-brand-500" />
      </div>
    );
  }

  const currentQIndex = session?.currentQuestionIndex ?? 0;
  const currentQ = questions[currentQIndex];
  const isEnded = session?.status === "ended";

  const handleSelect = (questionId: string, optionIdx: number) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [questionId]: optionIdx,
    }));
  };

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
                Final standings for {quizData?.title}
              </p>

              <div className="mt-8 space-y-3">
                {leaderboard.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6">No entries recorded.</p>
                ) : (
                  leaderboard.map((item, idx) => (
                    <div
                      key={item.uid}
                      className={`flex items-center justify-between rounded-2xl border p-4 transition-all ${
                        idx === 0
                          ? "border-amber-500/50 bg-amber-500/10 font-bold"
                          : idx === 1
                          ? "border-slate-400/40 bg-slate-400/10 font-semibold"
                          : idx === 2
                          ? "border-amber-700/40 bg-amber-700/10 font-semibold"
                          : "bg-card/60"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-lg font-extrabold w-6 text-center">
                          {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                        </span>
                        <span className="font-display text-base text-foreground">{item.displayName}</span>
                      </div>
                      <span className="font-mono text-base font-extrabold text-amber-500">
                        {item.score} pts
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-8">
                <Button onClick={() => router.push("/quiz")} className="w-full font-bold">
                  Back to All Quizzes
                </Button>
              </div>
            </Card>
          </motion.div>
        ) : session?.status === "waiting" ? (
          /* Waiting Screen */
          <motion.div
            key="waiting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="p-12 text-center space-y-4">
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
                <span className="text-uipath-orange font-bold flex items-center gap-1">
                  <Radio className="h-3.5 w-3.5" /> Synchronized
                </span>
              </div>

              <h2 className="font-display text-2xl font-extrabold sm:text-3xl leading-snug">
                {currentQ?.prompt}
              </h2>

              <div className="mt-8 space-y-3">
                {currentQ?.options?.map((opt: string, oIdx: number) => {
                  const isSelected = selectedOptions[currentQ.id] === oIdx;
                  const isRevealed = session?.revealAnswer;

                  return (
                    <button
                      key={oIdx}
                      type="button"
                      onClick={() => handleSelect(currentQ.id, oIdx)}
                      className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left font-medium transition-all ${
                        isSelected
                          ? "border-brand-500 bg-brand-500/15 ring-2 ring-brand-500/30 text-brand-600 dark:text-brand-400 font-bold"
                          : "bg-card hover:bg-accent"
                      }`}
                    >
                      <span className="text-base">{opt}</span>
                      {isSelected && <CheckCircle2 className="h-5 w-5 text-brand-500" />}
                    </button>
                  );
                })}
              </div>

              {session?.revealAnswer && (
                <div className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-600 dark:text-emerald-400 text-sm font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" /> Instructor revealed answer!
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
