"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

import {
  Activity,
  ArrowRight,
  Clock,
  Crown,
  HelpCircle,
  Radio,
  Users,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/shared/spinner";
import type { LiveQuizSession, Quiz } from "@/types";

interface LiveSessionCard {
  quiz: Quiz & { id: string };
  session: LiveQuizSession | null;
  participantCount: number;
}

function StatusBadge({ status }: { status?: string }) {
  if (status === "active") {
    return (
      <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1.5 font-bold">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
        Active
      </Badge>
    );
  }
  if (status === "waiting") {
    return (
      <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1.5 font-bold">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 inline-block" />
        Waiting
      </Badge>
    );
  }
  if (status === "ended") {
    return (
      <Badge variant="secondary" className="gap-1.5 font-bold">
        Ended
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1.5 font-bold text-muted-foreground">
      No Session
    </Badge>
  );
}

export default function AdminLiveQuizMonitorPage() {
  const [sessions, setSessions] = useState<LiveSessionCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [participantCounts, setParticipantCounts] = useState<Record<string, number>>({});
  const [sessionStates, setSessionStates] = useState<Record<string, LiveQuizSession | null>>({});

  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/admin/live-sessions").then((r) => r.json());
      if (res.ok) {
        setSessions(res.data.sessions ?? []);
        const counts: Record<string, number> = {};
        const states: Record<string, LiveQuizSession | null> = {};
        for (const s of res.data.sessions ?? []) {
          counts[s.quiz.id] = s.participantCount ?? 0;
          states[s.quiz.id] = s.session ?? null;
        }
        setParticipantCounts(counts);
        setSessionStates(states);
      }
    } catch (err) {
      console.error("Failed to load live sessions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchSessions();
    const interval = setInterval(() => {
      void fetchSessions();
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-8 w-8 text-brand-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Live Quiz Monitor</h1>
          <p className="text-muted-foreground mt-1">
            Real-time view of all active live quiz sessions.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-uipath-orange/30 bg-uipath-orange/10 px-4 py-1.5 text-sm font-bold text-uipath-orange">
          <Radio className="h-4 w-4 animate-pulse" />
          Live Monitoring
        </div>
      </div>

      {/* Stats Strip */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-2xl font-bold">
                {sessions.filter((s) => (sessionStates[s.quiz.id]?.status ?? s.session?.status) === "active").length}
              </p>
              <p className="text-xs text-muted-foreground">Active Sessions</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-brand-500">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-2xl font-bold">
                {Object.values(participantCounts).reduce((a, b) => a + b, 0)}
              </p>
              <p className="text-xs text-muted-foreground">Total Participants</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-2xl font-bold">{sessions.length}</p>
              <p className="text-xs text-muted-foreground">Live Quizzes</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Session Cards */}
      {sessions.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <Radio className="h-8 w-8" />
            </div>
            <div>
              <p className="font-display text-lg font-bold">No Live Sessions</p>
              <p className="text-sm text-muted-foreground mt-1">
                When a quiz is set to live mode, it will appear here in real time.
              </p>
            </div>
            <Button asChild variant="outline" className="gap-2">
              <Link href="/admin/quizzes">
                <Zap className="h-4 w-4" /> Manage Quizzes
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          <AnimatePresence>
            {sessions.map((s) => {
              const liveSession = sessionStates[s.quiz.id] ?? s.session;
              const pCount = participantCounts[s.quiz.id] ?? s.participantCount;
              const sessionStatus = liveSession?.status;
              const qIdx = liveSession?.currentQuestionIndex ?? 0;
              const totalQ = (s.quiz as any).questionCount ?? 0;

              return (
                <motion.div
                  key={s.quiz.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.25 }}
                >
                  <Card className="group relative overflow-hidden border-2 transition-all hover:border-brand-500/40 hover:shadow-lg">
                    {/* Animated top accent for active sessions */}
                    {sessionStatus === "active" && (
                      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-500 via-uipath-orange to-brand-500 animate-pulse" />
                    )}

                    <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="font-display text-lg truncate">
                            {s.quiz.title}
                          </CardTitle>
                          <StatusBadge status={sessionStatus} />
                        </div>
                        {s.quiz.hostDisplayName && (
                          <p className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground font-medium">
                            <Crown className="h-3 w-3 text-amber-500" />
                            Hosted by {s.quiz.hostDisplayName}
                          </p>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Stats row */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="flex flex-col items-center rounded-xl bg-muted/50 p-3 text-center">
                          <Users className="h-4 w-4 text-brand-500 mb-1" />
                          <span className="font-mono text-xl font-bold">{pCount}</span>
                          <span className="text-[10px] text-muted-foreground mt-0.5">Players</span>
                        </div>
                        <div className="flex flex-col items-center rounded-xl bg-muted/50 p-3 text-center">
                          <HelpCircle className="h-4 w-4 text-uipath-orange mb-1" />
                          <span className="font-mono text-xl font-bold">
                            {sessionStatus && sessionStatus !== "waiting" ? qIdx + 1 : "–"}
                          </span>
                          <span className="text-[10px] text-muted-foreground mt-0.5">
                            {totalQ > 0 ? `of ${totalQ} Q` : "Question"}
                          </span>
                        </div>
                        <div className="flex flex-col items-center rounded-xl bg-muted/50 p-3 text-center">
                          <Clock className="h-4 w-4 text-muted-foreground mb-1" />
                          <span className="font-mono text-xl font-bold">
                            {liveSession?.questionDurationSeconds ?? "–"}
                          </span>
                          <span className="text-[10px] text-muted-foreground mt-0.5">Sec / Q</span>
                        </div>
                      </div>

                      {/* Action */}
                      <Button asChild className="w-full gap-2 font-bold" size="sm">
                        <Link href={`/admin/live-quiz/${s.quiz.id}`}>
                          Go to Stage <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
