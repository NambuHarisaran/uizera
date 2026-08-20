"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Check,
  ChevronRight,
  Info,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/shared/spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { useAchievements, useClaimQuest } from "@/lib/hooks";
import { BADGES } from "@/lib/constants";
import { formatCoins, rankStyleForLevel, rankTitleForLevel, xpForLevel } from "@/lib/utils";
import type { BadgeDef, Quest } from "@/types";

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

const TIER_STYLES: Record<string, { label: string; border: string; glow: string; badge: string; bg: string }> = {
  bronze: {
    label: "Bronze Rarity",
    border: "border-amber-700/40 hover:border-amber-700/80",
    glow: "shadow-amber-700/10",
    badge: "bg-amber-700/15 text-amber-700 dark:text-amber-500 border-amber-700/30",
    bg: "from-amber-700/10 to-transparent",
  },
  silver: {
    label: "Silver Rarity",
    border: "border-slate-400/40 hover:border-slate-400/80",
    glow: "shadow-slate-400/10",
    badge: "bg-slate-400/15 text-slate-300 border-slate-400/30",
    bg: "from-slate-400/10 to-transparent",
  },
  gold: {
    label: "Gold Rarity",
    border: "border-amber-500/50 hover:border-amber-500",
    glow: "shadow-amber-500/20",
    badge: "bg-amber-500/15 text-amber-500 border-amber-500/40 font-bold",
    bg: "from-amber-500/15 to-transparent",
  },
  legend: {
    label: "Legendary Mythic",
    border: "border-purple-500/60 hover:border-purple-400 ring-1 ring-purple-500/40",
    glow: "shadow-purple-500/30",
    badge: "bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/50 font-black animate-pulse",
    bg: "from-purple-500/20 via-pink-500/10 to-transparent",
  },
};

export function AchievementsContent() {
  const { data, isLoading } = useAchievements();
  const claimMutation = useClaimQuest();
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [badgeFilter, setBadgeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "unlocked" | "locked">("all");
  const [selectedBadge, setSelectedBadge] = useState<BadgeDef | null>(null);

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
        `🎉 Reward Claimed! +${res.xpAwarded} XP and +${res.coinsAwarded} Coins added!`
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to claim quest.");
    } finally {
      setClaimingId(null);
    }
  };

  const filteredBadges = BADGES.filter((b) => {
    const isUnlocked = unlockedBadges.has(b.id);
    if (statusFilter === "unlocked" && !isUnlocked) return false;
    if (statusFilter === "locked" && isUnlocked) return false;
    if (badgeFilter !== "all" && b.tier !== badgeFilter) return false;
    return true;
  });

  const nextRank = level < 10 ? "Coder (Lv. 10)" : level < 20 ? "Expert (Lv. 20)" : level < 30 ? "Master (Lv. 30)" : level < 40 ? "Champion (Lv. 40)" : "Max Champion (Lv. 50)";

  return (
    <div className="pb-24 space-y-12">
      {/* Hero Header & Level Progression */}
      <section className="hero-glow relative overflow-hidden py-20 border-b">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-20" />
        <div className="container relative max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-4"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-sm font-semibold text-purple-400">
              <Award className="h-4 w-4" /> Level & Achievements Hub
            </div>
            <h1 className="font-display text-4xl font-extrabold sm:text-5xl tracking-tight">
              Mastery & <span className="text-gradient">Quests</span>
            </h1>
            <p className="max-w-2xl mx-auto text-sm sm:text-base text-muted-foreground">
              Earn XP by completing quizzes, approved challenges, and 30-day certification streaks. Reach <strong className="text-foreground font-bold">Level 40 (Champion)</strong> to unlock SDC leadership eligibility.
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
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Lifetime XP: <span className="font-semibold text-foreground font-mono">{formatCoins(xp)} XP</span>
                          <span className="mx-2">·</span>
                          <span>Next Rank: <strong className="text-foreground">{nextRank}</strong></span>
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-3 w-full sm:w-auto">
                      <div className="rounded-xl border bg-muted/30 px-3.5 py-2.5 text-center">
                        <p className="font-display text-base sm:text-lg font-bold text-amber-500">
                          {unlockedBadges.size} / {BADGES.length}
                        </p>
                        <p className="text-[10px] sm:text-[11px] text-muted-foreground font-medium">Badges Unlocked</p>
                      </div>
                      <div className="rounded-xl border bg-muted/30 px-3.5 py-2.5 text-center">
                        <p className="font-display text-base sm:text-lg font-bold text-emerald-500">
                          {quests.filter((q) => q.claimed).length} / {quests.length}
                        </p>
                        <p className="text-[10px] sm:text-[11px] text-muted-foreground font-medium">Quests Completed</p>
                      </div>
                    </div>
                  </div>

                  {/* XP Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Sparkles className="h-3.5 w-3.5 text-brand-500" />
                        Level {level} Progress
                      </span>
                      <span className="text-brand-500 font-bold font-mono">{progressPct}%</span>
                    </div>
                    <Progress value={progressPct} className="h-3 bg-muted rounded-full" />
                    <div className="flex justify-between text-[11px] text-muted-foreground font-mono">
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

      <div className="container max-w-5xl space-y-14">
        {/* Quests & Missions Section */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-500 uppercase tracking-wider mb-1">
                <Target className="h-3.5 w-3.5" /> Rewards & Missions
              </div>
              <h2 className="font-display text-2xl font-bold flex items-center gap-2">
                Active Quests & Missions
              </h2>
              <p className="text-xs text-muted-foreground">
                Complete daily and lifetime challenges to claim bonus XP and coins.
              </p>
            </div>
          </div>

          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Quests ({quests.length})</TabsTrigger>
              <TabsTrigger value="daily">Daily Quests ({quests.filter((q) => q.category === "daily").length})</TabsTrigger>
              <TabsTrigger value="lifetime">Lifetime Quests ({quests.filter((q) => q.category === "lifetime").length})</TabsTrigger>
            </TabsList>

            {["all", "daily", "lifetime"].map((tab) => (
              <TabsContent key={tab} value={tab} className="space-y-4 focus-visible:outline-none">
                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <Spinner className="h-8 w-8 text-brand-500" />
                  </div>
                ) : quests.filter((q) => tab === "all" || q.category === tab).length === 0 ? (
                  <EmptyState
                    icon={Target}
                    title="No quests available here"
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
                            className={`transition-all duration-300 ${
                              q.claimed
                                ? "border-emerald-500/30 bg-emerald-500/5 opacity-85"
                                : q.completed
                                ? "border-brand-500 bg-brand-500/10 shadow-lg shadow-brand-500/10 ring-2 ring-brand-500/30"
                                : "hover:border-brand-500/40 bg-card"
                            }`}
                          >
                            <CardHeader className="flex flex-row items-start justify-between pb-2">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500 border border-brand-500/20">
                                  <IconComponent className="h-5 w-5" />
                                </div>
                                <div className="min-w-0">
                                  <CardTitle className="text-base font-bold truncate">
                                    {q.title}
                                  </CardTitle>
                                  <Badge variant="outline" className="text-[10px] uppercase font-mono mt-1">
                                    {q.category}
                                  </Badge>
                                </div>
                              </div>

                              {q.claimed ? (
                                <Badge variant="success" className="gap-1 shrink-0">
                                  <CheckCircle2 className="h-3 w-3" /> Claimed
                                </Badge>
                              ) : (
                                <div className="text-right font-mono text-xs shrink-0 pl-2">
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

                              <div className="space-y-1.5">
                                <div className="flex justify-between text-[11px] font-semibold text-muted-foreground font-mono">
                                  <span>Progress ({pct}%)</span>
                                  <span>
                                    {q.current} / {q.target}
                                  </span>
                                </div>
                                <Progress value={pct} className="h-2 rounded-full" />
                              </div>

                              {!q.claimed && q.completed && (
                                <Button
                                  onClick={() => handleClaim(q.id)}
                                  disabled={claimingId === q.id}
                                  className="w-full gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold shadow-md shadow-emerald-500/20"
                                  size="sm"
                                >
                                  {claimingId === q.id ? (
                                    <Spinner className="text-white h-4 w-4" />
                                  ) : (
                                    <Sparkles className="h-4 w-4" />
                                  )}
                                  Claim {q.rewardCoins} Coins & {q.rewardXp} XP
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

        {/* Badges Showcase Section */}
        <section className="space-y-6 pt-6 border-t">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-500 uppercase tracking-wider mb-1">
                <Trophy className="h-3.5 w-3.5" /> Collectibles & Honors
              </div>
              <h2 className="font-display text-2xl font-bold flex items-center gap-2">
                Badges Showcase
              </h2>
              <p className="text-xs text-muted-foreground">
                Earn special badges as you level up, pass quizzes, and submit RPA challenges.
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center bg-muted/60 p-1 rounded-xl gap-1">
                <Button
                  variant={statusFilter === "all" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setStatusFilter("all")}
                  className="text-xs h-7 px-2.5 rounded-lg"
                >
                  All ({BADGES.length})
                </Button>
                <Button
                  variant={statusFilter === "unlocked" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setStatusFilter("unlocked")}
                  className="text-xs h-7 px-2.5 rounded-lg text-emerald-500"
                >
                  Unlocked ({unlockedBadges.size})
                </Button>
                <Button
                  variant={statusFilter === "locked" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setStatusFilter("locked")}
                  className="text-xs h-7 px-2.5 rounded-lg"
                >
                  Locked ({BADGES.length - unlockedBadges.size})
                </Button>
              </div>

              <div className="flex items-center gap-1">
                {["all", "bronze", "silver", "gold", "legend"].map((tier) => (
                  <Button
                    key={tier}
                    variant={badgeFilter === tier ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setBadgeFilter(tier)}
                    className="capitalize text-xs h-7 px-2.5 rounded-lg"
                  >
                    {tier}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
            {filteredBadges.map((badge) => {
              const isUnlocked = unlockedBadges.has(badge.id);
              const IconComp = ICON_MAP[badge.icon] || Award;
              const tierConf = TIER_STYLES[badge.tier] ?? TIER_STYLES.bronze;

              return (
                <Card
                  key={badge.id}
                  onClick={() => setSelectedBadge(badge)}
                  className={`group relative cursor-pointer overflow-hidden p-5 text-center transition-all duration-300 hover:scale-[1.02] ${
                    isUnlocked
                      ? `${tierConf.border} bg-gradient-to-b ${tierConf.bg} shadow-md ${tierConf.glow}`
                      : "opacity-60 grayscale border-border bg-muted/20 hover:opacity-80"
                  }`}
                >
                  {/* Lock / Unlock Icon Badge */}
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-card border shadow-sm group-hover:scale-105 transition-transform">
                    {isUnlocked ? (
                      <IconComp className="h-7 w-7 text-amber-500 animate-pulse" />
                    ) : (
                      <Lock className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>

                  <div className="flex items-center justify-center gap-1 mb-2">
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider ${tierConf.badge}`}>
                      {badge.tier}
                    </span>
                    {isUnlocked && (
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500 text-[10px]">
                        <Check className="h-2.5 w-2.5" />
                      </span>
                    )}
                  </div>

                  <h3 className="font-display text-sm font-bold truncate text-foreground group-hover:text-brand-500 transition-colors">
                    {badge.name}
                  </h3>
                  <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2 leading-tight">
                    {badge.description}
                  </p>
                </Card>
              );
            })}
          </div>
        </section>
      </div>

      {/* Badge Inspection Dialog */}
      <Dialog open={!!selectedBadge} onOpenChange={(open) => !open && setSelectedBadge(null)}>
        {selectedBadge && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" /> Badge Inspection
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-5 pt-2 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-muted/50 border-2 border-brand-500/30 shadow-lg">
                {(() => {
                  const IconComp = ICON_MAP[selectedBadge.icon] || Award;
                  const isUnlocked = unlockedBadges.has(selectedBadge.id);
                  return isUnlocked ? (
                    <IconComp className="h-10 w-10 text-amber-500" />
                  ) : (
                    <Lock className="h-9 w-9 text-muted-foreground" />
                  );
                })()}
              </div>

              <div>
                <span className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs uppercase font-bold text-amber-500 bg-amber-500/10">
                  {selectedBadge.tier} Tier Badge
                </span>
                <h3 className="font-display text-2xl font-bold mt-2">
                  {selectedBadge.name}
                </h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                  {selectedBadge.description}
                </p>
              </div>

              <div className="rounded-xl border p-4 bg-muted/30 text-left space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className={unlockedBadges.has(selectedBadge.id) ? "font-bold text-emerald-500 flex items-center gap-1" : "text-muted-foreground"}>
                    {unlockedBadges.has(selectedBadge.id) ? "✓ Unlocked & In Profile" : "🔒 Locked (In Progress)"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rarity Class:</span>
                  <span className="font-semibold capitalize">{selectedBadge.tier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Community Showcase:</span>
                  <span className="font-semibold">Appears on Leaderboard Profile</span>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={() => setSelectedBadge(null)}
                className="w-full"
              >
                Close Details
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

