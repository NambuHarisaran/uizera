"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Crown,
  Radio,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/shared/spinner";
import type { Quiz } from "@/types";

function QuizStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    live: { label: "Live", className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" },
    draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
    scheduled: { label: "Scheduled", className: "bg-brand-500/15 text-brand-600 border-brand-500/30" },
    closed: { label: "Closed", className: "bg-slate-500/15 text-slate-600" },
  };
  const cfg = map[status] ?? { label: status, className: "" };
  return <Badge className={`font-bold ${cfg.className}`}>{cfg.label}</Badge>;
}

export default function HostPortalPage() {
  const [quizzes, setQuizzes] = useState<(Quiz & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/host/quizzes")
      .then((r) => r.json())
      .then((res) => {
        if (res.ok) setQuizzes(res.data.quizzes ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-8 w-8 text-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Crown className="h-6 w-6 text-amber-500" />
          <h1 className="font-display text-3xl font-bold">My Assigned Quizzes</h1>
        </div>
        <p className="text-muted-foreground">
          Quizzes you have been assigned to host. Click "Start Hosting" to open the stage control.
        </p>
      </div>

      {quizzes.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
              <Zap className="h-8 w-8" />
            </div>
            <div>
              <p className="font-display text-lg font-bold">No Quizzes Assigned Yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                An admin needs to assign you as the host for a quiz before it appears here.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((quiz, idx) => (
            <motion.div
              key={quiz.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06 }}
            >
              <Card className="group border-2 transition-all hover:border-amber-500/40 hover:shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="font-display text-lg leading-snug">{quiz.title}</CardTitle>
                    <QuizStatusBadge status={quiz.status} />
                  </div>
                  {quiz.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{quiz.description}</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Zap className="h-3.5 w-3.5 text-brand-500" />
                      {quiz.questionCount ?? 0} Questions
                    </span>
                    <span className="flex items-center gap-1">
                      <Radio className="h-3.5 w-3.5 text-uipath-orange" />
                      Live Mode
                    </span>
                  </div>
                  <Button asChild className="w-full gap-2 font-bold bg-amber-500 hover:bg-amber-600 text-white" size="sm">
                    <Link href={`/host/${quiz.id}`}>
                      Start Hosting <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
