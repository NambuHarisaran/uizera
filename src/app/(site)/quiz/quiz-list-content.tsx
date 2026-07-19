"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Calendar, Clock, Coins, HelpCircle, Radio, Trophy, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/shared/spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { useQuizzes } from "@/lib/hooks";
import { formatCoins, formatDuration, toDate } from "@/lib/utils";
import type { Quiz, QuizStatus } from "@/types";

const statusConfig: Record<QuizStatus, { label: string; color: string }> = {
  draft: { label: "Draft", color: "bg-gray-500/10 text-gray-600 dark:text-gray-400" },
  scheduled: { label: "Upcoming", color: "bg-sky-500/10 text-sky-600 dark:text-sky-400" },
  live: { label: "Live Now", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  closed: { label: "Closed", color: "bg-muted text-muted-foreground" },
};

function QuizCard({ quiz }: { quiz: Quiz }) {
  const config = statusConfig[quiz.status];
  const startDate = toDate(quiz.startAt);
  const isPlayable = quiz.status === "live" || quiz.status === "scheduled";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="group flex flex-col rounded-2xl border bg-card transition-all duration-300 hover:border-brand-500/30 hover:shadow-lg hover:shadow-brand-500/5"
    >
      {quiz.coverImage && (
        <div className="aspect-[16/9] overflow-hidden rounded-t-2xl bg-muted">
          <img
            src={quiz.coverImage}
            alt={quiz.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      )}
      <div className="flex flex-1 flex-col p-6">
        <div className="mb-3 flex items-center gap-2">
          <Badge className={config.color}>{config.label}</Badge>
          {quiz.status === "live" && (
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
          )}
        </div>

        <h3 className="mb-2 font-display text-lg font-semibold">{quiz.title}</h3>
        {quiz.description && (
          <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">{quiz.description}</p>
        )}

        <div className="mt-auto space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-brand-500" />
            {quiz.questionCount} questions
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-brand-500" />
            {formatDuration(quiz.durationSeconds)}
          </div>
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-amber-500" />
            Up to {formatCoins(quiz.totalPoints * quiz.coinsPerPoint)} coins
          </div>
          {startDate && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-brand-500" />
              {format(startDate, "PPp")}
            </div>
          )}
        </div>

        {isPlayable && (
          <div className="mt-5 flex flex-col gap-2">
            <Button asChild className="gap-2 bg-brand-500 hover:bg-brand-600">
              <Link href={`/quiz/${quiz.id}`}>
                <Zap className="h-4 w-4" /> Take Standard Quiz
              </Link>
            </Button>
            {quiz.status === "live" && (
              <Button asChild variant="outline" className="gap-2 border-uipath-orange text-uipath-orange hover:bg-uipath-orange/10 font-bold">
                <Link href={`/quiz/${quiz.id}/live`}>
                  <Radio className="h-4 w-4 animate-pulse text-uipath-orange" /> Join Live Stage Quiz
                </Link>
              </Button>
            )}
          </div>
        )}
        {quiz.status === "closed" && (
          <Button asChild variant="outline" className="mt-5 gap-2">
            <Link href={`/quiz/${quiz.id}`}>
              <Trophy className="h-4 w-4" /> View Results
            </Link>
          </Button>
        )}
      </div>
    </motion.div>
  );
}

export function QuizListContent() {
  const { data, isLoading } = useQuizzes();
  const quizzes = (data?.quizzes ?? []) as Quiz[];

  const live = quizzes.filter((q) => q.status === "live");
  const scheduled = quizzes.filter((q) => q.status === "scheduled");
  const closed = quizzes.filter((q) => q.status === "closed");

  return (
    <div className="pb-24">
      <section className="hero-glow relative overflow-hidden py-24">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-20" />
        <div className="container relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl text-center"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-sm font-medium text-brand-600 dark:text-brand-400">
              <Zap className="h-4 w-4" />
              Quizzes
            </div>
            <h1 className="font-display text-4xl font-bold sm:text-5xl">
              Test Your <span className="text-gradient">Knowledge</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Take timed quizzes, compete with peers, and earn coins for every correct answer.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container py-16">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner className="h-8 w-8" />
          </div>
        ) : quizzes.length === 0 ? (
          <EmptyState
            icon={Zap}
            title="No quizzes available"
            description="Quizzes will appear here when admins publish them. Check back soon!"
          />
        ) : (
          <div className="space-y-14">
            {live.length > 0 && (
              <section>
                <h2 className="mb-6 flex items-center gap-2 font-display text-2xl font-bold">
                  <span className="relative flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
                  </span>
                  Live Now
                </h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {live.map((q) => <QuizCard key={q.id} quiz={q} />)}
                </div>
              </section>
            )}
            {scheduled.length > 0 && (
              <section>
                <h2 className="mb-6 font-display text-2xl font-bold">Upcoming</h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {scheduled.map((q) => <QuizCard key={q.id} quiz={q} />)}
                </div>
              </section>
            )}
            {closed.length > 0 && (
              <section>
                <h2 className="mb-6 font-display text-2xl font-bold">Completed</h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {closed.map((q) => <QuizCard key={q.id} quiz={q} />)}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
