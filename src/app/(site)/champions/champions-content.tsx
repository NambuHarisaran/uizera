"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Award,
  CheckCircle2,
  Crown,
  Flame,
  Medal,
  Send,
  ShieldAlert,
  Sparkles,
  Star,
  Trophy,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Spinner } from "@/components/shared/spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { useAuth } from "@/components/providers/auth-provider";
import { useLeaderboard } from "@/lib/hooks";
import { formatCoins, initials, levelForXp, rankStyleForLevel } from "@/lib/utils";

const RANK_TIERS = [
  { level: "1 - 9", title: "Rookie", color: "border-slate-500/40 bg-slate-500/10 text-slate-400" },
  { level: "10 - 19", title: "Coder", color: "border-blue-500/50 bg-blue-500/15 text-blue-500" },
  { level: "20 - 29", title: "Expert", color: "border-emerald-500/50 bg-emerald-500/15 text-emerald-500" },
  { level: "30 - 39", title: "Master", color: "border-purple-500/50 bg-purple-500/15 text-purple-400" },
  { level: "40 - 50", title: "Champion", color: "border-amber-500/50 bg-amber-500/15 text-amber-500 font-extrabold animate-pulse" },
];

export function ChampionsContent() {
  const { user } = useAuth();
  const { data, isLoading } = useLeaderboard("overall");
  const entries = data?.entries ?? [];

  const [statement, setStatement] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [applied, setApplied] = useState(false);

  const champions = entries.filter((e) => levelForXp(e.xp) >= 40).slice(0, 10);
  const userLevel = user ? user.level : 1;
  const isChampion = userLevel >= 40;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setApplied(true);
      toast.success("Application Submitted! The UiPath Community Team will review your application.");
    }, 1200);
  };

  return (
    <div className="pb-24 space-y-12">
      {/* Hero Header */}
      <section className="hero-glow relative overflow-hidden py-24 border-b">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-20" />
        <div className="container relative max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-4"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-1.5 text-sm font-extrabold text-amber-500">
              <Crown className="h-4 w-4 animate-bounce" /> Level 40 - 50 Champions Selection
            </div>

            <h1 className="font-display text-4xl font-extrabold sm:text-5xl">
              UiPath Student Developer <span className="text-gradient">Champions</span>
            </h1>
            <p className="max-w-2xl mx-auto text-base text-muted-foreground">
              The top 10 members to reach Champion rank (Level 40+) get exclusive eligibility to apply for the next official UiPath Student Developer Champion cohort at PSNA CET.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container max-w-5xl space-y-12">
        {/* Level Ranks Breakdown */}
        <section className="space-y-4">
          <h2 className="font-display text-2xl font-bold flex items-center gap-2">
            <Trophy className="h-6 w-6 text-amber-500" /> Rank Progression (Level 1..50)
          </h2>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-5">
            {RANK_TIERS.map((tier) => (
              <div key={tier.title} className={`rounded-xl border p-4 text-center transition-all ${tier.color}`}>
                <p className="font-mono text-xs opacity-75">Level {tier.level}</p>
                <p className="font-display text-lg font-bold mt-1">{tier.title}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Top 10 Champions Hall of Fame */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-bold flex items-center gap-2">
                <Crown className="h-6 w-6 text-amber-500" /> Champions Hall of Fame (Top 10)
              </h2>
              <p className="text-xs text-muted-foreground">
                First members to achieve Level 40+ Champion Status.
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner className="h-8 w-8 text-amber-500" />
            </div>
          ) : champions.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="No Champions Yet!"
              description="Be among the first 10 members to reach Level 40+ to unlock your entry into the UiPath Student Developer Champions Hall of Fame."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {champions.map((champ, idx) => (
                <Card key={champ.uid} className="border-2 border-amber-500/40 bg-gradient-to-tr from-amber-500/5 to-transparent p-4 flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="shrink-0 font-mono text-lg font-black text-amber-500">#{idx + 1}</span>
                    <Avatar className="h-10 w-10 shrink-0 border-2 border-amber-500">
                      <AvatarImage src={champ.photoURL ?? undefined} />
                      <AvatarFallback>{initials(champ.displayName)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <h4 className="truncate font-bold text-sm text-foreground" title={champ.displayName}>
                        {champ.displayName}
                      </h4>
                      <p className="truncate text-xs text-muted-foreground">Level {levelForXp(champ.xp)} · {formatCoins(champ.xp)} XP</p>
                    </div>
                  </div>
                  <Badge className="shrink-0 bg-amber-500 text-black font-extrabold text-xs">
                    Champion
                  </Badge>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Application Section for Next UiPath Champions */}
        <section className="pt-6 border-t">
          <Card className="border-2 border-amber-500/50 bg-card/90 shadow-2xl p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-500">
                  <Star className="h-3.5 w-3.5" /> Next Cohort Selection (2026-27)
                </div>
                <h3 className="font-display text-2xl font-extrabold sm:text-3xl">
                  Apply for Next UiPath Student Developer Champion
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Qualified Champions (Level 40+) can apply directly to lead the PSNA CET UiPath Community as the official Student Developer Champion.
                </p>
              </div>

              {!isChampion && (
                <Badge variant="outline" className="border-amber-500/40 text-amber-500 bg-amber-500/10 p-2 text-xs font-semibold shrink-0 gap-1.5">
                  <ShieldAlert className="h-4 w-4" /> Requires Level 40
                </Badge>
              )}
            </div>

            <div className="mt-8 pt-6 border-t">
              {!isChampion ? (
                <div className="rounded-xl border border-dashed p-6 text-center space-y-2 bg-muted/20">
                  <p className="font-bold text-foreground">Application Currently Locked</p>
                  <p className="text-xs text-muted-foreground">
                    Your current level is <strong className="text-foreground font-bold">Level {userLevel} ({rankStyleForLevel(userLevel).title})</strong>. Reach Level 40 (Champion Rank) to unlock the application form.
                  </p>
                </div>
              ) : applied ? (
                <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-6 text-center space-y-2 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
                  <h4 className="font-display text-lg font-bold">Application Received!</h4>
                  <p className="text-xs text-muted-foreground">
                    Thank you for applying. The faculty in-charge and current SDC champion will get in touch for the interview round.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground">GitHub / Portfolio URL</label>
                    <Input
                      type="url"
                      placeholder="https://github.com/yourusername"
                      required
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground">Why do you want to be the next SDC Champion?</label>
                    <Textarea
                      placeholder="Share your automation achievements, projects, and vision for the community..."
                      required
                      rows={4}
                      value={statement}
                      onChange={(e) => setStatement(e.target.value)}
                    />
                  </div>

                  <Button type="submit" disabled={submitting} className="w-full gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold">
                    {submitting ? <Spinner className="text-black" /> : <Send className="h-4 w-4" />}
                    Submit SDC Champion Application
                  </Button>
                </form>
              )}
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}
