"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Award,
  CheckCircle2,
  Coins,
  Crown,
  Flame,
  Gem,
  Hammer,
  Landmark,
  Medal,
  Shield,
  Sparkles,
  Target,
  Trophy,
  Zap,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/shared/spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { useAchievements, useClaimQuest } from "@/lib/hooks";
import { BADGES } from "@/lib/constants";
import { formatCoins, rankStyleForLevel } from "@/lib/utils";
import type { Quest } from "@/types";

const ICON_MAP: Record<string, any> = {
  Zap,
  Flame,
  Crown,
  Sparkles,
  Target,
  Hammer,
  Shield,
  Medal,
  Trophy,
  Coins,
  Gem,
  Landmark,
  Award,
};

export function AchievementsContent() {
  const { data, isLoading } = useAchievements();
  const claimMutation = useClaimQuest();
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [badgeFilter, setBadgeFilter] = useState<string>("all");

  const level = data?.level ?? 1;
  const xp = data?.xp ?? 0;
  const progressPct = Math.round((data?.progress ?? 0) * 100);
  const quests = data?.quests ?? [];
  const unlockedBadges = new Set(data?.badges ?? []);

  const handleClaim = async (questId: string) => {
    setClaimingId(questId);
    try {
      const res = await claimMutation.mutateAsync(questId);
      toast.success(
        `Reward Claimed! +${res.xpAwarded} XP and +${res.coinsAwarded} Coins added!`
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to claim quest.");
    } finally {
      setClaimingId(null);
    }
  };

  const filteredBadges = BADGES.filter(
    (b) => badgeFilter === "all" || b.tier === badgeFilter
  );

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
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-sm font-semibold text-purple-400">
              <Award className="h-4 w-4" /> Level & Achievements
            </div>
            <h1 className="font-display text-4xl font-extrabold sm:text-5xl">
              Mastery & <span className="text-gradient">Quests</span>
            </h1>
            <p className="max-w-2xl mx-auto text-base text-muted-foreground">
              Earn XP by completing quizzes, approved challenges, and certification days. Max Level is <strong className="text-foreground font-bold">50</strong>.
            </p>

            {/* Level & XP Card */}
            <Card className="mt-8 overflow-hidden border-2 border-brand-500/30 bg-card/80 backdrop-blur-xl shadow-2xl p-6 sm:p-8 max-w-3xl mx-auto text-left">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Spinner className="h-8 w-8 text-brand-500" />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-purple-600 text-white font-display text-2xl font-black shadow-lg shadow-brand-500/20 ring-4 ring-brand-500/20">
                        {level}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="font-display text-2xl font-bold">
                            Level {level}
                          </h2>
                          <Badge variant="outline" className={`text-xs uppercase tracking-wider ${rankStyleForLevel(level).badgeClass}`}>
                            {rankStyleForLevel(level).title}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Lifetime XP: <span className="font-semibold text-foreground">{formatCoins(xp)} XP</span>
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-3 w-full sm:w-auto">
                      <div className="rounded-xl border bg-muted/30 px-3 py-2 text-center">
                        <p className="font-display text-base sm:text-lg font-bold text-amber-500">
                          {unlockedBadges.size} / {BADGES.length}
                        </p>
                        <p className="text-[10px] sm:text-[11px] text-muted-foreground">Badges</p>
                      </div>
                      <div className="rounded-xl border bg-muted/30 px-3 py-2 text-center">
                        <p className="font-display text-base sm:text-lg font-bold text-emerald-500">
                          {quests.filter((q) => q.claimed).length} / {quests.length}
                        </p>
                        <p className="text-[10px] sm:text-[11px] text-muted-foreground">Quests Done</p>
                      </div>
                    </div>
                  </div>

                  {/* XP Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span>Level Progress</span>
                      <span className="text-brand-500 font-bold">{progressPct}%</span>
                    </div>
                    <Progress value={progressPct} className="h-3 bg-muted" />
                    <div className="flex justify-between text-[11px] text-muted-foreground">
                      <span>Floor: {formatCoins(data?.currentLevelFloor ?? 0)} XP</span>
                      <span>Next Level: {level >= 50 ? "MAX LEVEL 50" : `${formatCoins(data?.nextLevelXp ?? 0)} XP`}</span>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        </div>
      </section>

      <div className="container max-w-5xl space-y-12">
        {/* Quests Section */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-bold flex items-center gap-2">
                <Target className="h-6 w-6 text-brand-500" /> Active Quests & Missions
              </h2>
              <p className="text-xs text-muted-foreground">
                Complete missions to claim bonus XP and coins.
              </p>
            </div>
          </div>

          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Quests</TabsTrigger>
              <TabsTrigger value="daily">Daily Quests</TabsTrigger>
              <TabsTrigger value="lifetime">Lifetime Quests</TabsTrigger>
            </TabsList>

            {["all", "daily", "lifetime"].map((tab) => (
              <TabsContent key={tab} value={tab} className="space-y-4">
                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <Spinner className="h-8 w-8 text-brand-500" />
                  </div>
                ) : quests.filter((q) => tab === "all" || q.category === tab).length === 0 ? (
                  <EmptyState
                    icon={Target}
                    title="No quests here"
                    description="Check back soon for new missions in this category."
                  />
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {quests
                      .filter((q) => tab === "all" || q.category === tab)
                      .map((q) => {
                        const IconComponent = ICON_MAP[q.icon] || Target;
                        const pct = Math.min(100, Math.round((q.current / q.target) * 100));

                        return (
                          <Card
                            key={q.id}
                            className={`transition-all ${
                              q.claimed
                                ? "border-emerald-500/30 bg-emerald-500/5 opacity-80"
                                : q.completed
                                ? "border-brand-500 bg-brand-500/10 ring-2 ring-brand-500/20"
                                : "hover:border-brand-500/30"
                            }`}
                          >
                            <CardHeader className="flex flex-row items-start justify-between pb-2">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500">
                                  <IconComponent className="h-5 w-5" />
                                </div>
                                <div>
                                  <CardTitle className="text-base font-bold">
                                    {q.title}
                                  </CardTitle>
                                  <Badge variant="outline" className="text-[10px] uppercase font-mono mt-1">
                                    {q.category}
                                  </Badge>
                                </div>
                              </div>

                              {q.claimed ? (
                                <Badge variant="success" className="gap-1">
                                  <CheckCircle2 className="h-3 w-3" /> Claimed
                                </Badge>
                              ) : (
                                <div className="text-right font-mono text-xs">
                                  <span className="text-purple-400 font-bold">+{q.rewardXp} XP</span>
                                  <br />
                                  <span className="text-amber-500 font-bold">+{q.rewardCoins} Coins</span>
                                </div>
                              )}
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                {q.description}
                              </p>

                              <div className="space-y-1">
                                <div className="flex justify-between text-[11px] font-semibold text-muted-foreground">
                                  <span>Progress</span>
                                  <span>
                                    {q.current} / {q.target}
                                  </span>
                                </div>
                                <Progress value={pct} className="h-2" />
                              </div>

                              {!q.claimed && q.completed && (
                                <Button
                                  onClick={() => handleClaim(q.id)}
                                  disabled={claimingId === q.id}
                                  className="w-full gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold"
                                  size="sm"
                                >
                                  {claimingId === q.id ? (
                                    <Spinner className="text-white h-4 w-4" />
                                  ) : (
                                    <Sparkles className="h-4 w-4" />
                                  )}
                                  Claim Reward
                                </Button>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </section>

        {/* Badges Section */}
        <section className="space-y-6 pt-6 border-t">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-bold flex items-center gap-2">
                <Trophy className="h-6 w-6 text-amber-500" /> Badges Showcase
              </h2>
              <p className="text-xs text-muted-foreground">
                Earn special badges as you level up and complete achievements.
              </p>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
              {["all", "bronze", "silver", "gold", "legend"].map((tier) => (
                <Button
                  key={tier}
                  variant={badgeFilter === tier ? "default" : "outline"}
                  size="sm"
                  onClick={() => setBadgeFilter(tier)}
                  className="capitalize text-xs rounded-xl"
                >
                  {tier}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
            {filteredBadges.map((badge) => {
              const isUnlocked = unlockedBadges.has(badge.id);
              const IconComp = ICON_MAP[badge.icon] || Award;

              return (
                <Card
                  key={badge.id}
                  className={`relative overflow-hidden p-5 text-center transition-all ${
                    isUnlocked
                      ? "border-amber-500/40 bg-card hover:border-amber-500 shadow-md"
                      : "opacity-50 grayscale border-border bg-muted/20"
                  }`}
                >
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50 border">
                    {isUnlocked ? (
                      <IconComp className="h-7 w-7 text-amber-500 animate-pulse" />
                    ) : (
                      <Lock className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>

                  <Badge
                    variant={badge.tier}
                    className={`mb-2 capitalize text-[10px] ${badge.tier === "legend" ? "animate-pulse" : ""}`}
                  >
                    {badge.tier}
                  </Badge>
                  <h3 className="font-display text-sm font-bold truncate">
                    {badge.name}
                  </h3>
                  <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2">
                    {badge.description}
                  </p>
                </Card>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
