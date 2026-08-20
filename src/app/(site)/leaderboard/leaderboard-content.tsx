"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Award,
  Coins,
  Crown,
  Medal,
  Search,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/shared/spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { useAuth } from "@/components/providers/auth-provider";
import { useLeaderboard } from "@/lib/hooks";
import { formatCoins, initials, levelForXp, rankStyleForLevel, shortName } from "@/lib/utils";
import { BADGE_MAP } from "@/lib/constants";
import type { LeaderboardEntry, LeaderboardPeriod } from "@/types";

const coinField: Record<LeaderboardPeriod, "coins" | "weeklyCoins" | "monthlyCoins"> = {
  overall: "coins",
  weekly: "weeklyCoins",
  monthly: "monthlyCoins",
};

interface PodiumConfig {
  rank: number;
  label: string;
  icon: typeof Crown;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  cardGlow: string;
  pedestalHeight: string;
  pedestalBg: string;
  avatarRing: string;
  avatarSize: string;
  orderClass: string;
}

const podiumStyles: Record<number, PodiumConfig> = {
  0: {
    // 1st place - Gold (Center)
    rank: 1,
    label: "Champion",
    icon: Crown,
    badgeBg: "bg-amber-500/15",
    badgeBorder: "border-amber-500/50",
    badgeText: "text-amber-500 font-bold",
    cardGlow: "shadow-2xl shadow-amber-500/20 border-amber-500/60 bg-gradient-to-b from-amber-500/10 via-card to-card",
    pedestalHeight: "h-28 sm:h-36",
    pedestalBg: "bg-gradient-to-t from-amber-500/30 via-amber-500/15 to-transparent border-t-2 border-amber-400",
    avatarRing: "ring-4 ring-amber-400 shadow-lg shadow-amber-500/30",
    avatarSize: "h-20 w-20 sm:h-24 sm:w-24",
    orderClass: "order-2 sm:order-2 z-10 scale-105 sm:scale-110",
  },
  1: {
    // 2nd place - Silver (Left)
    rank: 2,
    label: "Runner-Up",
    icon: Medal,
    badgeBg: "bg-slate-400/15",
    badgeBorder: "border-slate-400/50",
    badgeText: "text-slate-300 font-semibold",
    cardGlow: "shadow-xl shadow-slate-400/10 border-slate-400/40 bg-gradient-to-b from-slate-400/10 via-card to-card",
    pedestalHeight: "h-20 sm:h-24",
    pedestalBg: "bg-gradient-to-t from-slate-400/25 via-slate-400/10 to-transparent border-t-2 border-slate-300",
    avatarRing: "ring-4 ring-slate-300 shadow-md shadow-slate-400/20",
    avatarSize: "h-16 w-16 sm:h-20 sm:w-20",
    orderClass: "order-1 sm:order-1",
  },
  2: {
    // 3rd place - Bronze (Right)
    rank: 3,
    label: "3rd Place",
    icon: Award,
    badgeBg: "bg-amber-700/15",
    badgeBorder: "border-amber-700/50",
    badgeText: "text-amber-600 dark:text-amber-500 font-semibold",
    cardGlow: "shadow-xl shadow-amber-700/10 border-amber-700/40 bg-gradient-to-b from-amber-700/10 via-card to-card",
    pedestalHeight: "h-14 sm:h-16",
    pedestalBg: "bg-gradient-to-t from-amber-700/25 via-amber-700/10 to-transparent border-t-2 border-amber-600",
    avatarRing: "ring-4 ring-amber-600 shadow-md shadow-amber-700/20",
    avatarSize: "h-16 w-16 sm:h-20 sm:w-20",
    orderClass: "order-3 sm:order-3",
  },
};

function TopThreePodium({ entries, period }: { entries: LeaderboardEntry[]; period: LeaderboardPeriod }) {
  const top = entries.slice(0, 3);
  if (top.length === 0) return null;

  // Display order: 2nd (left), 1st (center), 3rd (right)
  const displayItems = [
    { entry: top[1], rankIndex: 1 },
    { entry: top[0], rankIndex: 0 },
    { entry: top[2], rankIndex: 2 },
  ].filter((item) => item.entry !== undefined);

  return (
    <div className="mb-14">
      <div className="flex items-end justify-center gap-2 sm:gap-6 px-2">
        {displayItems.map(({ entry, rankIndex }, idx) => {
          if (!entry) return null;
          const conf = podiumStyles[rankIndex] ?? podiumStyles[0];
          const Icon = conf.icon;
          const coinsVal = entry[coinField[period]] as number;
          const level = levelForXp(entry.xp);
          const rankInfo = rankStyleForLevel(level);

          return (
            <motion.div
              key={entry.uid}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.12 }}
              className={`flex flex-col items-center text-center flex-1 max-w-[13rem] ${conf.orderClass}`}
            >
              {/* Floating Rank Crown Badge */}
              <div className="relative mb-2 flex items-center justify-center">
                <div
                  className={`flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold shadow-sm ${conf.badgeBg} ${conf.badgeBorder} ${conf.badgeText}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>#{conf.rank}</span>
                </div>
              </div>

              {/* Avatar with Glow Ring */}
              <div className="relative mb-3">
                <Avatar className={`${conf.avatarSize} ${conf.avatarRing} transition-transform hover:scale-105`}>
                  <AvatarImage src={entry.photoURL ?? undefined} alt={entry.displayName} />
                  <AvatarFallback className="font-display font-bold text-base sm:text-lg bg-card">
                    {initials(entry.displayName)}
                  </AvatarFallback>
                </Avatar>
                {rankIndex === 0 && (
                  <span className="absolute -top-2 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-black text-xs font-black shadow-md animate-bounce">
                    👑
                  </span>
                )}
              </div>

              {/* Player Info Box */}
              <div className={`w-full rounded-2xl border p-3 sm:p-4 backdrop-blur-sm ${conf.cardGlow}`}>
                <p
                  className="truncate font-display font-bold text-sm sm:text-base text-foreground"
                  title={entry.displayName}
                >
                  {shortName(entry.displayName)}
                </p>

                <div className="mt-1 flex items-center justify-center gap-1">
                  <Badge
                    variant="outline"
                    className={`truncate text-[10px] uppercase font-bold tracking-wider ${rankInfo.badgeClass}`}
                  >
                    {rankInfo.title} · Lv.{level}
                  </Badge>
                </div>

                <p className="mt-1 h-4 truncate text-[11px] text-muted-foreground">
                  {entry.department || "UiPath Builder"}
                </p>

                <div className="mt-2.5 inline-flex items-center justify-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1 text-xs sm:text-sm font-extrabold text-amber-500">
                  <Coins className="h-3.5 w-3.5 shrink-0" />
                  <span>{formatCoins(coinsVal)}</span>
                </div>
              </div>

              {/* Podium Pedestal Pillar */}
              <div
                className={`w-full rounded-b-xl flex flex-col items-center justify-center ${conf.pedestalHeight} ${conf.pedestalBg}`}
              >
                <span className="font-display font-black text-2xl sm:text-4xl text-foreground/25">
                  {conf.rank}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  {conf.label}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function LeaderboardTable({
  entries,
  period,
  searchQuery,
}: {
  entries: LeaderboardEntry[];
  period: LeaderboardPeriod;
  searchQuery: string;
}) {
  const filtered = useMemo(() => {
    const list = entries.slice(3);
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter(
      (e) =>
        e.displayName.toLowerCase().includes(q) ||
        (e.department && e.department.toLowerCase().includes(q))
    );
  }, [entries, searchQuery]);

  if (entries.length <= 3 && !searchQuery) return null;

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-xs text-muted-foreground">
              <th className="px-4 py-3.5 text-left font-semibold">#</th>
              <th className="px-4 py-3.5 text-left font-semibold">Member</th>
              <th className="px-4 py-3.5 text-left font-semibold hidden sm:table-cell">Department</th>
              <th className="px-4 py-3.5 text-left font-semibold hidden md:table-cell">Rank & Level</th>
              <th className="px-4 py-3.5 text-left font-semibold hidden md:table-cell">Badges</th>
              <th className="px-4 py-3.5 text-right font-semibold">Coins Earned</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-muted-foreground text-sm">
                  No community members found matching &quot;{searchQuery}&quot;.
                </td>
              </tr>
            ) : (
              filtered.map((entry) => {
                const actualRank = entries.indexOf(entry) + 1;
                const level = levelForXp(entry.xp);
                const rankInfo = rankStyleForLevel(level);

                return (
                  <motion.tr
                    key={entry.uid}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="transition-colors hover:bg-muted/30"
                  >
                    <td className="px-4 py-3.5 font-mono text-xs font-semibold text-muted-foreground">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted/60">
                        {actualRank}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 max-w-[12rem] sm:max-w-[16rem]">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar className="h-9 w-9 shrink-0 border shadow-xs">
                          <AvatarImage src={entry.photoURL ?? undefined} />
                          <AvatarFallback className="text-xs font-bold">{initials(entry.displayName)}</AvatarFallback>
                        </Avatar>
                        <div className="flex min-w-0 flex-col">
                          <span
                            className="truncate font-semibold text-foreground"
                            title={entry.displayName}
                          >
                            {shortName(entry.displayName)}
                          </span>
                          <span
                            className={`mt-0.5 inline-flex w-fit max-w-full items-center gap-1 truncate rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${rankInfo.badgeClass}`}
                          >
                            {rankInfo.title} · Lv.{level}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 max-w-[8rem] truncate text-xs text-muted-foreground hidden sm:table-cell">
                      {entry.department ? (
                        <Badge variant="secondary" className="font-normal text-xs">
                          {entry.department}
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-xs font-mono font-medium">
                          Lv. {level}
                        </Badge>
                        <span className="text-xs text-muted-foreground font-mono">
                          {formatCoins(entry.xp)} XP
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <div className="flex items-center gap-1">
                        {entry.badges.slice(0, 3).map((b) => {
                          const def = BADGE_MAP.get(b);
                          return def ? (
                            <span
                              key={b}
                              title={def.name}
                              className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/10 text-xs border border-amber-500/20"
                            >
                              🏅
                            </span>
                          ) : null;
                        })}
                        {entry.badges.length > 3 && (
                          <span className="text-xs font-medium text-muted-foreground">
                            +{entry.badges.length - 3}
                          </span>
                        )}
                        {entry.badges.length === 0 && (
                          <span className="text-xs text-muted-foreground/60">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="inline-flex items-center gap-1 font-bold text-amber-500">
                        <Coins className="h-3.5 w-3.5" />
                        {formatCoins(entry[coinField[period]] as number)}
                      </span>
                    </td>
                  </motion.tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CurrentUserStanding({
  entries,
  period,
}: {
  entries: LeaderboardEntry[];
  period: LeaderboardPeriod;
}) {
  const { user } = useAuth();
  if (!user) return null;

  const userIndex = entries.findIndex((e) => e.uid === user.uid);
  const userRank = userIndex >= 0 ? userIndex + 1 : null;
  const userCoins = ((user as unknown as Record<string, unknown>)[coinField[period]] as number) ?? user.coins;
  const userLevel = levelForXp(user.xp);
  const rankInfo = rankStyleForLevel(userLevel);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 rounded-2xl border-2 border-brand-500/40 bg-gradient-to-r from-brand-500/10 via-card to-card p-4 sm:p-5 shadow-lg"
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 w-full sm:w-auto">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-500 text-white font-display font-black text-lg shadow-md shadow-brand-500/25">
            {userRank ? `#${userRank}` : "—"}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-base text-foreground">
                Your Current Ranking
              </span>
              <Badge variant="outline" className={`text-[10px] uppercase font-bold ${rankInfo.badgeClass}`}>
                {rankInfo.title}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {userRank
                ? userRank <= 3
                  ? "🎉 You are currently on the Podium!"
                  : `Ranked #${userRank} out of ${entries.length} builders`
                : "Complete quizzes & challenges to join the leaderboard!"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
          <div className="text-right">
            <p className="text-[11px] text-muted-foreground">Your {period} Coins</p>
            <p className="font-display text-lg font-bold text-amber-500 flex items-center gap-1">
              <Coins className="h-4 w-4" />
              {formatCoins(userCoins || 0)}
            </p>
          </div>
          <div className="text-right border-l pl-4">
            <p className="text-[11px] text-muted-foreground">Lifetime XP</p>
            <p className="font-display text-lg font-bold text-foreground">
              {formatCoins(user.xp)}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function LeaderboardContent() {
  const [period, setPeriod] = useState<LeaderboardPeriod>("overall");
  const [searchQuery, setSearchQuery] = useState("");
  const { data, isLoading } = useLeaderboard(period);
  const entries = data?.entries ?? [];

  // Summary Metrics
  const totalCoinsPool = useMemo(() => {
    return entries.reduce((acc, e) => acc + ((e[coinField[period]] as number) || 0), 0);
  }, [entries, period]);

  return (
    <div className="pb-24">
      {/* Hero Section */}
      <section className="hero-glow relative overflow-hidden py-20 border-b">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-20" />
        <div className="container relative">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-3xl text-center"
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-1.5 text-sm font-semibold text-amber-500">
              <Trophy className="h-4 w-4" />
              Community Leaderboard
            </div>
            <h1 className="font-display text-4xl font-extrabold sm:text-5xl tracking-tight">
              Top <span className="text-gradient">Automators</span>
            </h1>
            <p className="mt-3 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              Compete with fellow UiPath builders at PSNA CET. Earn coins from live quizzes, approved challenges, and 30-day certification streaks.
            </p>

            {/* Quick Stats Bar */}
            <div className="mt-8 grid grid-cols-3 gap-3 max-w-lg mx-auto">
              <div className="rounded-2xl border bg-card/60 backdrop-blur-md p-3 text-center">
                <p className="font-display text-lg sm:text-xl font-bold text-foreground">
                  {entries.length}
                </p>
                <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1">
                  <Users className="h-3 w-3" /> Ranked Builders
                </p>
              </div>
              <div className="rounded-2xl border bg-card/60 backdrop-blur-md p-3 text-center">
                <p className="font-display text-lg sm:text-xl font-bold text-amber-500">
                  {entries[0] ? formatCoins(entries[0][coinField[period]] as number) : 0}
                </p>
                <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1">
                  <Crown className="h-3 w-3 text-amber-500" /> Top Score
                </p>
              </div>
              <div className="rounded-2xl border bg-card/60 backdrop-blur-md p-3 text-center">
                <p className="font-display text-lg sm:text-xl font-bold text-brand-500">
                  {formatCoins(totalCoinsPool)}
                </p>
                <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1">
                  <Zap className="h-3 w-3 text-brand-500" /> Total Coins
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="container py-12 max-w-5xl">
        <Tabs
          value={period}
          onValueChange={(v) => setPeriod(v as LeaderboardPeriod)}
          className="w-full"
        >
          {/* Controls Bar: Tabs + Search */}
          <div className="mb-10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <TabsList className="grid grid-cols-3 w-full sm:w-auto h-11 p-1 bg-muted/60 rounded-xl">
              <TabsTrigger value="overall" className="rounded-lg text-xs sm:text-sm font-semibold">
                All-Time
              </TabsTrigger>
              <TabsTrigger value="monthly" className="rounded-lg text-xs sm:text-sm font-semibold">
                This Month
              </TabsTrigger>
              <TabsTrigger value="weekly" className="rounded-lg text-xs sm:text-sm font-semibold">
                This Week
              </TabsTrigger>
            </TabsList>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search member or dept..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs rounded-xl"
              />
            </div>
          </div>

          {["overall", "monthly", "weekly"].map((p) => (
            <TabsContent key={p} value={p} className="space-y-8 mt-0 focus-visible:outline-none">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-3">
                  <Spinner className="h-10 w-10 text-brand-500" />
                  <p className="text-xs text-muted-foreground animate-pulse">Calculating rankings...</p>
                </div>
              ) : entries.length === 0 ? (
                <EmptyState
                  icon={Trophy}
                  title="No rankings for this period"
                  description="Be the first to earn coins by completing quizzes and weekly RPA challenges!"
                />
              ) : (
                <>
                  <TopThreePodium entries={entries} period={period} />
                  <LeaderboardTable
                    entries={entries}
                    period={period}
                    searchQuery={searchQuery}
                  />
                  <CurrentUserStanding entries={entries} period={period} />
                </>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
