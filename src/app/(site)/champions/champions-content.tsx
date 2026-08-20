"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Award,
  CheckCircle2,
  Crown,
  Flame,
  Globe,
  Medal,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Spinner } from "@/components/shared/spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { useAuth } from "@/components/providers/auth-provider";
import { useLeaderboard } from "@/lib/hooks";
import { formatCoins, initials, levelForXp, rankStyleForLevel, shortName } from "@/lib/utils";

const RANK_TIERS = [
  {
    level: "1 - 9",
    title: "Rookie",
    color: "border-slate-500/40 bg-slate-500/10 text-slate-400",
    desc: "Starting automation journey",
    perk: "Access to daily quizzes & basic tutorials",
  },
  {
    level: "10 - 19",
    title: "Coder",
    color: "border-blue-500/50 bg-blue-500/15 text-blue-500",
    desc: "Building Studio workflows",
    perk: "Weekly RPA challenges submission",
  },
  {
    level: "20 - 29",
    title: "Expert",
    color: "border-emerald-500/50 bg-emerald-500/15 text-emerald-500",
    desc: "Advanced RPA automator",
    perk: "30-Day Certification fast-track verification",
  },
  {
    level: "30 - 39",
    title: "Master",
    color: "border-purple-500/50 bg-purple-500/15 text-purple-400",
    desc: "Agentic AI & enterprise RPA",
    perk: "Host live community quizzes & mentor peers",
  },
  {
    level: "40 - 50",
    title: "Champion",
    color: "border-amber-500/60 bg-amber-500/15 text-amber-500 font-extrabold ring-2 ring-amber-500/30",
    desc: "Top Automation Leaders",
    perk: "Eligible for official UiPath SDC Selection",
  },
];

const SDC_PERKS = [
  { icon: Crown, title: "Official UiPath Recognition", desc: "Recognized as the primary Student Developer Champion by UiPath Academic Alliance." },
  { icon: Users, title: "Lead PSNA CET Community", desc: "Guide 100+ students in workshops, hackathons, and automation sprints." },
  { icon: Globe, title: "Global Industry Network", desc: "Connect with UiPath MVPs, RPA leads, and enterprise recruiters." },
  { icon: Award, title: "Exclusive Swag & Vouchers", desc: "Free certification exam vouchers, swags, and recommendation letters." },
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
  const userLevel = user ? levelForXp(user.xp) : 1;
  const isChampion = userLevel >= 40;
  const progressToChampion = Math.min(100, Math.round((userLevel / 40) * 100));

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
      <section className="hero-glow relative overflow-hidden py-20 border-b">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-20" />
        <div className="container relative max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-4"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-1.5 text-sm font-extrabold text-amber-500 shadow-sm">
              <Crown className="h-4 w-4 animate-bounce" /> Level 40 - 50 Champions Selection
            </div>

            <h1 className="font-display text-4xl font-extrabold sm:text-5xl tracking-tight">
              UiPath Student Developer <span className="text-gradient">Champions</span>
            </h1>
            <p className="max-w-2xl mx-auto text-sm sm:text-base text-muted-foreground">
              The top members to reach Champion rank (Level 40+) get exclusive eligibility to apply for the official UiPath Student Developer Champion cohort at PSNA CET.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container max-w-5xl space-y-14">
        {/* Rank Progression Roadmap */}
        <section className="space-y-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-500 uppercase tracking-wider mb-1">
              <Trophy className="h-3.5 w-3.5" /> Mastery Path
            </div>
            <h2 className="font-display text-2xl font-bold flex items-center gap-2">
              Rank Progression Roadmap (Level 1..50)
            </h2>
            <p className="text-xs text-muted-foreground">
              Earn lifetime XP through quizzes, challenges, and certifications to advance through the community tiers.
            </p>
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
            {RANK_TIERS.map((tier) => (
              <div key={tier.title} className={`rounded-2xl border p-4 text-center transition-all flex flex-col justify-between ${tier.color}`}>
                <div>
                  <span className="font-mono text-[11px] uppercase tracking-wider font-semibold opacity-80">
                    Level {tier.level}
                  </span>
                  <h3 className="font-display text-xl font-bold mt-1">{tier.title}</h3>
                  <p className="text-xs opacity-75 mt-1">{tier.desc}</p>
                </div>
                <div className="mt-3 pt-3 border-t border-current/20 text-[10px] leading-tight font-medium opacity-90">
                  🎁 {tier.perk}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Top 10 Champions Hall of Fame */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-500 uppercase tracking-wider mb-1">
                <Medal className="h-3.5 w-3.5" /> Elite Honor Roll
              </div>
              <h2 className="font-display text-2xl font-bold flex items-center gap-2">
                Champions Hall of Fame (Top 10)
              </h2>
              <p className="text-xs text-muted-foreground">
                Community members who have achieved Level 40+ Champion Status.
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
                <Card
                  key={champ.uid}
                  className="relative overflow-hidden border-2 border-amber-500/50 bg-gradient-to-tr from-amber-500/10 via-card to-card p-5 shadow-lg shadow-amber-500/5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3.5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-black font-display font-black text-base shadow-md">
                        #{idx + 1}
                      </div>
                      <Avatar className="h-12 w-12 shrink-0 border-2 border-amber-400 ring-2 ring-amber-500/30">
                        <AvatarImage src={champ.photoURL ?? undefined} />
                        <AvatarFallback className="font-bold">{initials(champ.displayName)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <h4 className="truncate font-bold text-sm sm:text-base text-foreground" title={champ.displayName}>
                          {shortName(champ.displayName)}
                        </h4>
                        <p className="truncate text-xs text-muted-foreground">
                          Level {levelForXp(champ.xp)} · {formatCoins(champ.xp)} XP
                        </p>
                      </div>
                    </div>

                    <Badge className="shrink-0 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-extrabold text-xs shadow-xs">
                      <Crown className="h-3 w-3 mr-1" /> Champion
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* SDC Champion Perks */}
        <section className="space-y-6 pt-6 border-t">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-500 uppercase tracking-wider mb-1">
              <Star className="h-3.5 w-3.5" /> Leadership Role
            </div>
            <h2 className="font-display text-2xl font-bold">
              Why Become an SDC Champion?
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SDC_PERKS.map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.title} className="rounded-2xl border p-5 bg-card/60 space-y-2 hover:border-brand-500/30 transition-all">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display font-bold text-sm">{p.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{p.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Application Section for Next UiPath Champions */}
        <section className="pt-4">
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
                <Badge variant="outline" className="border-amber-500/40 text-amber-500 bg-amber-500/10 p-2.5 text-xs font-semibold shrink-0 gap-1.5 rounded-xl">
                  <ShieldAlert className="h-4 w-4" /> Requires Level 40
                </Badge>
              )}
            </div>

            <div className="mt-8 pt-6 border-t">
              {!isChampion ? (
                <div className="rounded-2xl border border-dashed p-6 sm:p-8 text-center space-y-4 bg-muted/20">
                  <div>
                    <p className="font-bold text-base text-foreground">Application Currently Locked</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                      Your current standing is <strong className="text-foreground font-bold">Level {userLevel} ({rankStyleForLevel(userLevel).title})</strong>. Advance {40 - userLevel} more levels to unlock the official SDC selection application!
                    </p>
                  </div>

                  <div className="max-w-md mx-auto space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-muted-foreground font-mono">
                      <span>Level {userLevel} of 40</span>
                      <span>{progressToChampion}% Ready</span>
                    </div>
                    <Progress value={progressToChampion} className="h-2.5 rounded-full" />
                  </div>
                </div>
              ) : applied ? (
                <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-8 text-center space-y-3 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
                  <h4 className="font-display text-xl font-bold">Application Received!</h4>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                    Thank you for applying for the SDC Champion role. The faculty in-charge and current SDC champion will get in touch for the interview round.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">GitHub / Portfolio URL</label>
                    <Input
                      type="url"
                      placeholder="https://github.com/yourusername"
                      required
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Why do you want to be the next SDC Champion?</label>
                    <Textarea
                      placeholder="Share your automation achievements, projects, community contributions, and vision for the PSNA CET community..."
                      required
                      rows={4}
                      value={statement}
                      onChange={(e) => setStatement(e.target.value)}
                    />
                  </div>

                  <Button type="submit" disabled={submitting} className="w-full gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold text-sm shadow-lg shadow-amber-500/20">
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

