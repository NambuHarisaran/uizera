"use client";

import { use, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { doc, collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { clientDb } from "@/lib/firebase/client";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { CheckCircle2, Clock, Coins, Crown, Flame, Radio, Sparkles, Trophy, XCircle, Zap } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/shared/spinner";
import { postJson, unwrap } from "@/lib/fetcher";
import { useAuth } from "@/components/providers/auth-provider";
import type { LiveQuizSession } from "@/types";

// Helper for option colors
const OPTION_STYLES = [
  "border-l-4 border-l-blue-500 bg-blue-500/5 hover:bg-blue-500/10 data-[selected=true]:bg-blue-500/20 data-[selected=true]:border-blue-600 data-[selected=true]:ring-2 data-[selected=true]:ring-blue-500",
  "border-l-4 border-l-orange-500 bg-orange-500/5 hover:bg-orange-500/10 data-[selected=true]:bg-orange-500/20 data-[selected=true]:border-orange-600 data-[selected=true]:ring-2 data-[selected=true]:ring-orange-500",
  "border-l-4 border-l-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/10 data-[selected=true]:bg-emerald-500/20 data-[selected=true]:border-emerald-600 data-[selected=true]:ring-2 data-[selected=true]:ring-emerald-500",
  "border-l-4 border-l-purple-500 bg-purple-500/5 hover:bg-purple-500/10 data-[selected=true]:bg-purple-500/20 data-[selected=true]:border-purple-600 data-[selected=true]:ring-2 data-[selected=true]:ring-purple-500",
];

export default function PlayerLiveQuizPage({
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
  const [myAnswer, setMyAnswer] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});
  const [coinFeedback, setCoinFeedback] = useState<{ coins: number; correct: boolean; responseTimeMs?: number } | null>(null);
  const [correctIndices, setCorrectIndices] = useState<Record<string, number[]>>({});

  // Initial fetch
  useEffect(() => {
    async function loadInitialData() {
      try {
        const res = await fetch(`/api/live-quiz/${quizId}`);
        if (!res.ok) {
          throw new Error("Failed to load initial data");
        }
        const data = await res.json();
        setQuizData(data.quiz);
        setSession(data.session);
        setQuestions(data.questions);
        
        // Also setup listener for session
        const sessionUnsub = onSnapshot(doc(clientDb(), "liveQuizSessions", quizId), (docSnap) => {
          if (docSnap.exists()) {
            setSession(docSnap.data() as LiveQuizSession);
          }
        });

        // Setup listener for answers/leaderboard
        const q = query(
          collection(clientDb(), "liveQuizSessions", quizId, "answers"),
          orderBy("totalCoins", "desc")
        );
        const leaderboardUnsub = onSnapshot(q, (snapshot) => {
          const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          setLeaderboard(docs);
          if (user) {
            const me = docs.find(d => d.id === user.uid);
            if (me) setMyAnswer(me);
          }
        });

        setLoading(false);
        return () => {
          sessionUnsub();
          leaderboardUnsub();
        };
      } catch (err) {
        console.error(err);
        toast.error("Could not load quiz.");
        router.push("/quiz");
      }
    }
    if (user) {
      loadInitialData();
    }
  }, [quizId, router, user]);

  // Handle local state when question changes
  useEffect(() => {
    if (session?.currentQuestionIndex !== undefined) {
      setCoinFeedback(null);
    }
  }, [session?.currentQuestionIndex]);

  const submitAnswer = async (questionId: string, selectedIndex: number) => {
    if (submitting || submitted[questionId] || session?.revealAnswer) return;
    
    setSubmitting(true);
    setSubmitted(prev => ({ ...prev, [questionId]: true }));
    
    try {
      const res = await postJson(`/api/live-quiz/${quizId}/answer`, {
        questionId,
        selectedIndex,
        answeredAtMs: Date.now(),
      });
      const result = unwrap(res) as any;
      
      setCoinFeedback({
        coins: result.coinsEarned,
        correct: result.correct,
        responseTimeMs: result.responseTimeMs,
      });
      
      if (result.correctIndices) {
        setCorrectIndices(prev => ({ ...prev, [questionId]: result.correctIndices }));
      }
      
      if (result.correct) {
        toast.success(`Correct! +${result.coinsEarned} coins ⚡`);
      } else {
        toast.error("Incorrect. The correct answer will be revealed soon.");
      }
      
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to submit answer");
      setSubmitted(prev => ({ ...prev, [questionId]: false }));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Spinner className="h-8 w-8 text-brand-500" />
      </div>
    );
  }

  if (!session) return null;

  // Render Waiting Screen
  if (session.status === "waiting") {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative w-full max-w-md"
        >
          <div className="absolute -inset-0.5 animate-pulse rounded-2xl bg-gradient-to-r from-brand-500 to-purple-500 opacity-20 blur" />
          <Card className="relative rounded-2xl border-brand-100 shadow-xl">
            <CardContent className="flex flex-col items-center p-12 text-center">
              <Image 
                src="/uizera-logo.png" 
                alt="UiZera" 
                width={160} 
                height={54} 
                className="mb-8"
              />
              <Spinner className="mb-6 h-10 w-10 text-brand-600" />
              <h2 className="font-display mb-2 text-2xl font-bold">
                Waiting for Instructor to Start
              </h2>
              <p className="text-muted-foreground">
                Get ready! Your screen will sync automatically.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Render Ended Screen
  if (session.status === "ended") {
    const myRank = leaderboard.findIndex(u => u.id === user?.uid) + 1;
    const correctCount = Object.values(myAnswer?.answers || {}).filter((a: any) => a.correct).length;
    
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center p-4 py-12">
        <Image 
          src="/uizera-logo.png" 
          alt="UiZera" 
          width={160} 
          height={54} 
          className="mb-8"
        />
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-4 text-yellow-500"
        >
          <Trophy className="h-16 w-16 animate-bounce" />
        </motion.div>
        
        <h2 className="font-display mb-8 text-4xl font-bold text-slate-900">
          Live Quiz Complete! 🎉
        </h2>

        <div className="mb-12 grid w-full gap-4 md:grid-cols-3">
          <Card className="bg-brand-50">
            <CardContent className="flex flex-col items-center p-6 text-center">
              <span className="text-sm font-medium text-brand-600 uppercase">Your Rank</span>
              <span className="font-mono mt-2 text-4xl font-bold text-slate-900">
                #{myRank > 0 ? myRank : "-"}
              </span>
            </CardContent>
          </Card>
          <Card className="bg-yellow-50">
            <CardContent className="flex flex-col items-center p-6 text-center">
              <span className="text-sm font-medium text-yellow-600 uppercase">Total Coins</span>
              <span className="font-mono mt-2 flex items-center gap-2 text-4xl font-bold text-slate-900">
                {myAnswer?.totalCoins || 0}
                <Coins className="h-6 w-6 text-yellow-500" />
              </span>
            </CardContent>
          </Card>
          <Card className="bg-emerald-50">
            <CardContent className="flex flex-col items-center p-6 text-center">
              <span className="text-sm font-medium text-emerald-600 uppercase">Correct</span>
              <span className="font-mono mt-2 text-4xl font-bold text-slate-900">
                {correctCount}
              </span>
            </CardContent>
          </Card>
        </div>

        <div className="w-full">
          <h3 className="font-display mb-6 flex items-center justify-center gap-2 text-2xl font-bold">
            🏆 Final Leaderboard
          </h3>
          <div className="flex flex-col gap-3">
            {leaderboard.slice(0, 10).map((player, idx) => (
              <motion.div
                key={player.id}
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: idx * 0.1 }}
                className={`flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm border ${player.id === user?.uid ? 'border-brand-500 ring-1 ring-brand-500' : 'border-slate-100'}`}
              >
                <div className="flex items-center gap-4">
                  <div className="font-mono flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-lg font-bold">
                    {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                  </div>
                  <span className="font-medium text-foreground">{player.displayName}</span>
                  {player.id === user?.uid && (
                    <Badge variant="secondary" className="bg-brand-100 text-brand-700">You</Badge>
                  )}
                </div>
                <div className="font-mono flex items-center gap-1 font-bold text-slate-900">
                  {player.totalCoins} <Coins className="h-4 w-4 text-yellow-500" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <Button 
          size="lg" 
          className="mt-12 rounded-full"
          onClick={() => router.push("/quiz")}
        >
          Back to All Quizzes
        </Button>
      </div>
    );
  }

  // Active Screen
  const currentIndex = session.currentQuestionIndex || 0;
  const currentQuestion = questions[currentIndex];
  
  if (!currentQuestion) return null;
  
  const questionId = currentQuestion.id;
  const hasSubmitted = submitted[questionId];
  const myAnswerForQ = myAnswer?.answers?.[questionId];
  const selectedIndex = myAnswerForQ?.selectedIndex;
  
  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl flex-col p-4 py-8">
      {/* Top Bar */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-slate-900">
            {quizData?.title}
          </h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>Q{currentIndex + 1} of {questions.length}</span>
            <span className="flex items-center gap-1 text-red-500">
              <Radio className="h-3 w-3 animate-pulse" /> LIVE
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 rounded-full bg-yellow-50 px-4 py-2 font-mono text-lg font-bold text-yellow-700">
          <Coins className="h-5 w-5 text-yellow-500" />
          {myAnswer?.totalCoins || 0}
        </div>
      </div>

      {/* Question Prompt */}
      <div className="mb-10 text-center">
        <h2 className="font-display text-3xl font-bold leading-tight text-slate-900 md:text-4xl">
          {currentQuestion.prompt}
        </h2>
      </div>

      {/* Options Grid */}
      <div className="mb-8 grid gap-4 md:grid-cols-2">
        {currentQuestion.options.map((opt: string, i: number) => {
          const isSelected = selectedIndex === i;
          const isCorrectOption = correctIndices[questionId]?.includes(i);
          const showReveal = session.revealAnswer;
          
          let stateStyles = OPTION_STYLES[i % OPTION_STYLES.length];
          let Icon = null;
          
          if (showReveal) {
            if (isCorrectOption) {
              stateStyles = "border-l-4 border-l-green-500 bg-green-500/20 ring-2 ring-green-500 font-bold";
              Icon = <CheckCircle2 className="h-5 w-5 text-green-600" />;
            } else if (isSelected) {
              stateStyles = "border-l-4 border-l-red-500 bg-red-500/10 ring-2 ring-red-500 opacity-70";
              Icon = <XCircle className="h-5 w-5 text-red-600" />;
            } else {
              stateStyles = "border-l-4 border-l-slate-300 bg-slate-50 opacity-50";
            }
          }

          return (
            <button
              key={i}
              data-selected={!showReveal && isSelected}
              disabled={showReveal || hasSubmitted || submitting}
              onClick={() => submitAnswer(questionId, i)}
              className={`relative flex min-h-[5rem] w-full items-center justify-between rounded-xl p-4 text-left transition-all ${stateStyles} ${(!showReveal && !hasSubmitted) ? 'active:scale-95' : ''}`}
            >
              <span className="text-lg font-medium text-slate-800">{opt}</span>
              {Icon && <span>{Icon}</span>}
              {!showReveal && submitting && isSelected && (
                <Spinner className="h-4 w-4 text-slate-400" />
              )}
            </button>
          );
        })}
      </div>

      {/* Feedback Banner Mid-Question */}
      <AnimatePresence>
        {hasSubmitted && !session.revealAnswer && coinFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`flex items-center justify-between rounded-xl p-4 ${
              coinFeedback.correct ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            <div className="flex items-center gap-3">
              {coinFeedback.correct ? (
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              ) : (
                <XCircle className="h-6 w-6 text-red-600" />
              )}
              <div>
                <p className="font-bold">
                  {coinFeedback.correct 
                    ? `Correct! +${coinFeedback.coins} coins ⚡` 
                    : "Incorrect. The correct answer will be revealed soon."}
                </p>
                {coinFeedback.responseTimeMs && (
                  <p className="flex items-center gap-1 text-sm opacity-80">
                    <Clock className="h-3 w-3" />
                    Answered in {(coinFeedback.responseTimeMs / 1000).toFixed(1)}s
                  </p>
                )}
              </div>
            </div>
            {coinFeedback.correct && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", bounce: 0.5 }}
              >
                <Coins className="h-8 w-8 text-yellow-500" />
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live Leaderboard (Revealed State) */}
      <AnimatePresence>
        {session.revealAnswer && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-8 flex flex-col gap-4 overflow-hidden"
          >
            <div className="flex items-center gap-2 border-b pb-2">
              <Trophy className="h-6 w-6 text-yellow-500" />
              <h3 className="font-display text-xl font-bold text-slate-900">
                Live Standings
              </h3>
            </div>
            
            <div className="flex flex-col gap-2">
              {leaderboard.slice(0, 10).map((player, idx) => {
                const thisQ = player.answers?.[questionId];
                const gained = thisQ?.coinsEarned || 0;
                
                return (
                  <motion.div
                    key={player.id}
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`flex items-center justify-between rounded-2xl bg-white p-3 shadow-sm border ${
                      player.id === user?.uid ? 'border-brand-500 bg-brand-50/30' : 'border-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="font-mono flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 font-bold text-slate-600">
                        {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                      </div>
                      <span className="font-medium text-foreground">{player.displayName}</span>
                      {player.id === user?.uid && (
                        <Badge variant="outline" className="border-brand-200 text-brand-600 bg-white">You</Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {gained > 0 && (
                        <span className="font-mono text-sm font-bold text-green-500">
                          +{gained}
                        </span>
                      )}
                      <div className="font-mono flex w-16 items-center justify-end gap-1 font-bold text-slate-900">
                        {player.totalCoins} <Coins className="h-4 w-4 text-yellow-500" />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            
            {/* If user not in top 10 */}
            {user && !leaderboard.slice(0, 10).find(p => p.id === user.uid) && (
              <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-center text-sm text-slate-600">
                Your current rank: <strong className="font-mono text-slate-900">#{leaderboard.findIndex(p => p.id === user.uid) + 1}</strong>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
