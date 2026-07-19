"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Award, Coins, Crown, Medal, Trophy } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/shared/spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { useLeaderboard } from "@/lib/hooks";
import { formatCoins, initials, levelForXp } from "@/lib/utils";
import { BADGE_MAP } from "@/lib/constants";
import type { LeaderboardEntry, LeaderboardPeriod } from "@/types";

const coinField: Record<LeaderboardPeriod, keyof LeaderboardEntry> = {
  overall: "coins",
  weekly: "weeklyCoins",
  monthly: "monthlyCoins",
};

const rankIcons = [
  { icon: Crown, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30" },
  { icon: Medal, color: "text-gray-400", bg: "bg-gray-500/10 border-gray-500/30" },
  { icon: Award, color: "text-amber-700 dark:text-amber-600", bg: "bg-amber-700/10 border-amber-700/30" },
];

function TopThreeCards({ entries, period }: { entries: LeaderboardEntry[]; period: LeaderboardPeriod }) {
  const top = entries.slice(0, 3);
  if (top.length === 0) return null;

  // Display order: 2nd, 1st, 3rd
  const displayOrder = top.length >= 3 ? [top[1], top[0], top[2]] : top;

  return (
    <div className="mb-12 flex items-end justify-center gap-4 sm:gap-6">
      {displayOrder.map((entry, idx) => {
        if (!entry) return null;
        const actualRank = top.indexOf(entry);
        const config = rankIcons[actualRank] ?? rankIcons[2]!;
        const Icon = config.icon;
        const isFirst = actualRank === 0;

        return (
          <motion.div
            key={entry.uid}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
            className={`flex flex-col items-center ${isFirst ? "mb-4" : ""}`}
          >
            <div className={`relative mb-3 rounded-2xl border p-4 ${config.bg} ${isFirst ? "p-5" : ""}`}>
              <Icon className={`${config.color} ${isFirst ? "h-8 w-8" : "h-6 w-6"}`} />
            </div>
            <Avatar className={`border-2 ${isFirst ? "h-20 w-20 border-amber-400" : "h-16 w-16 border-muted"}`}>
              <AvatarImage src={entry.photoURL ?? undefined} alt={entry.displayName} />
              <AvatarFallback className="font-display">{initials(entry.displayName)}</AvatarFallback>
            </Avatar>
            <p className={`mt-2 font-display font-semibold ${isFirst ? "text-base" : "text-sm"}`}>
              {entry.displayName}
            </p>
            {entry.department && (
              <p className="text-xs text-muted-foreground">{entry.department}</p>
            )}
            <div className="mt-1.5 flex items-center gap-1 text-sm font-bold text-amber-500">
              <Coins className="h-3.5 w-3.5" />
              {formatCoins(entry[coinField[period]] as number)}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Level {levelForXp(entry.xp)}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
}

function LeaderboardTable({ entries, period }: { entries: LeaderboardEntry[]; period: LeaderboardPeriod }) {
  const remaining = entries.slice(3);
  if (remaining.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-xs text-muted-foreground">
              <th className="px-4 py-3 text-left font-medium">#</th>
              <th className="px-4 py-3 text-left font-medium">Member</th>
              <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Dept</th>
              <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Level</th>
              <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Badges</th>
              <th className="px-4 py-3 text-right font-medium">Coins</th>
            </tr>
          </thead>
          <tbody>
            {remaining.map((entry, i) => (
              <motion.tr
                key={entry.uid}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.02 }}
                className="border-b last:border-0 transition-colors hover:bg-muted/30"
              >
                <td className="px-4 py-3 font-medium text-muted-foreground">{i + 4}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={entry.photoURL ?? undefined} />
                      <AvatarFallback className="text-xs">{initials(entry.displayName)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{entry.displayName}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                  {entry.department ?? "—"}
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <Badge variant="outline" className="text-xs">
                    Lv. {levelForXp(entry.xp)}
                  </Badge>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <div className="flex gap-1">
                    {entry.badges.slice(0, 3).map((b) => {
                      const def = BADGE_MAP.get(b);
                      return def ? (
                        <span
                          key={b}
                          title={def.name}
                          className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-500/10 text-[10px]"
                        >
                          🏅
                        </span>
                      ) : null;
                    })}
                    {entry.badges.length > 3 && (
                      <span className="text-xs text-muted-foreground">+{entry.badges.length - 3}</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="font-semibold text-amber-500">
                    {formatCoins(entry[coinField[period]] as number)}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function LeaderboardContent() {
  const [period, setPeriod] = useState<LeaderboardPeriod>("overall");
  const { data, isLoading } = useLeaderboard(period);
  const entries = data?.entries ?? [];

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
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-sm font-medium text-amber-600 dark:text-amber-400">
              <Trophy className="h-4 w-4" />
              Leaderboard
            </div>
            <h1 className="font-display text-4xl font-bold sm:text-5xl">
              Top <span className="text-gradient">Performers</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              See who&apos;s leading the community in coins, quizzes, and achievements.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container py-16">
        <Tabs
          value={period}
          onValueChange={(v) => setPeriod(v as LeaderboardPeriod)}
          className="mx-auto max-w-4xl"
        >
          <div className="mb-8 flex justify-center">
            <TabsList>
              <TabsTrigger value="overall">Overall</TabsTrigger>
              <TabsTrigger value="weekly">This Week</TabsTrigger>
              <TabsTrigger value="monthly">This Month</TabsTrigger>
            </TabsList>
          </div>

          {["overall", "weekly", "monthly"].map((p) => (
            <TabsContent key={p} value={p}>
              {isLoading ? (
                <div className="flex justify-center py-16">
                  <Spinner className="h-8 w-8" />
                </div>
              ) : entries.length === 0 ? (
                <EmptyState
                  icon={Trophy}
                  title="No rankings yet"
                  description="Complete quizzes and challenges to appear on the leaderboard!"
                />
              ) : (
                <>
                  <TopThreeCards entries={entries} period={period} />
                  <LeaderboardTable entries={entries} period={period} />
                </>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
