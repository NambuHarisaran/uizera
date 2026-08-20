"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";

import {
  Award,
  Calendar,
  CheckCircle2,
  Coins,
  Copy,
  Edit,
  History,
  Mail,
  PlusCircle,
  MinusCircle,
  Save,
  Share2,
  Shield,
  Sparkles,
  Target,
  Trophy,
  User,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge, TIER_COLOR_CLASSES } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/shared/spinner";
import { BADGE_MAP, DEPARTMENTS, YEARS } from "@/lib/constants";
import { useCoinHistory } from "@/lib/hooks";
import { profileUpdateSchema } from "@/lib/validation";
import { formatCoins, initials, levelForXp, levelProgress, rankStyleForLevel, toDate, xpForLevel } from "@/lib/utils";
import type { CoinSource, CoinTransaction } from "@/types";
import type { z } from "zod";

type ProfileForm = z.infer<typeof profileUpdateSchema>;

const statCards = [
  { key: "coins", label: "Current Balance", icon: Coins, color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/20" },
  { key: "quizzesTaken", label: "Quizzes Completed", icon: Zap, color: "text-brand-500", bg: "bg-brand-500/10 border-brand-500/20" },
  { key: "challengesApproved", label: "Approved Challenges", icon: Target, color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/20" },
  { key: "certsCompleted", label: "30-Day Certs Done", icon: Award, color: "text-violet-500", bg: "bg-violet-500/10 border-violet-500/20" },
] as const;

function getSourceMeta(source: CoinSource): { label: string; icon: typeof Zap; color: string } {
  switch (source) {
    case "quiz":
      return { label: "Quiz Reward", icon: Zap, color: "text-brand-500 bg-brand-500/10" };
    case "challenge":
      return { label: "Challenge Approved", icon: Target, color: "text-emerald-500 bg-emerald-500/10" };
    case "certification":
      return { label: "Certification Day", icon: Award, color: "text-purple-500 bg-purple-500/10" };
    case "quest_reward":
      return { label: "Quest Claim", icon: Sparkles, color: "text-amber-500 bg-amber-500/10" };
    case "admin_adjustment":
      return { label: "Admin Adjustment", icon: Shield, color: "text-blue-500 bg-blue-500/10" };
    case "community_contribution":
      return { label: "Community Bonus", icon: Trophy, color: "text-orange-500 bg-orange-500/10" };
    default:
      return { label: "Coin Reward", icon: Coins, color: "text-amber-500 bg-amber-500/10" };
  }
}

export function ProfileContent() {
  const { user, loading, refreshUser } = useAuth();
  const { data: coinData, isLoading: loadingCoins } = useCoinHistory();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const transactions = coinData?.transactions ?? [];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      displayName: user?.displayName ?? "",
      department: (user?.department as any) ?? undefined,
      year: (user?.year as any) ?? undefined,
      regNo: user?.regNo ?? undefined,
      bio: user?.bio ?? undefined,
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        displayName: user.displayName ?? "",
        department: (user.department as any) ?? undefined,
        year: (user.year as any) ?? undefined,
        regNo: user.regNo ?? undefined,
        bio: user.bio ?? undefined,
      });
    }
  }, [user, reset]);

  const onSubmit = async (data: ProfileForm) => {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update profile.");
      await refreshUser();
      toast.success("Profile updated successfully!");
      setEditing(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const handleCopyShareLink = () => {
    const url = typeof window !== "undefined" ? `${window.location.origin}/leaderboard` : "https://uizera.com";
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      toast.success("Community link copied to clipboard!");
    }
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner className="h-8 w-8 text-brand-500" />
      </div>
    );
  }

  const level = levelForXp(user.xp);
  const progress = levelProgress(user.xp);
  const nextLevelXp = xpForLevel(level + 1);
  const currentFloorXp = xpForLevel(level);
  const rankInfo = rankStyleForLevel(level);

  return (
    <div className="pb-24">
      {/* Header Profile Hero */}
      <section className="hero-glow relative overflow-hidden py-20 border-b">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-20" />
        <div className="container relative max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-between gap-6 sm:flex-row sm:items-start"
          >
            <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
              <div className="relative">
                <Avatar className="h-28 w-28 shrink-0 border-4 border-brand-500/40 shadow-2xl ring-4 ring-brand-500/20">
                  <AvatarImage src={user.photoURL ?? undefined} alt={user.displayName} />
                  <AvatarFallback className="bg-uipath-orange/15 font-display text-3xl text-uipath-orange font-bold">
                    {initials(user.displayName)}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute -bottom-2 -right-1 flex h-8 w-8 items-center justify-center rounded-xl bg-brand-500 text-white font-display text-xs font-black shadow-md">
                  Lv.{level}
                </span>
              </div>

              <div className="min-w-0 max-w-full">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h1 className="truncate font-display text-3xl font-extrabold" title={user.displayName}>
                    {user.displayName}
                  </h1>
                  <Badge variant="outline" className={`text-xs uppercase font-bold tracking-wider ${rankInfo.badgeClass}`}>
                    {rankInfo.title}
                  </Badge>
                </div>

                <p className="mt-1 flex items-center justify-center sm:justify-start gap-1.5 text-xs text-muted-foreground" title={user.email}>
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  {user.email}
                </p>

                <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <Badge variant="outline" className="gap-1 bg-muted/40 text-xs">
                    <Shield className="h-3 w-3 text-brand-500" />
                    {user.role === "super_admin" ? "Super Admin" : user.role === "admin" ? "Admin" : user.role === "quiz_host" ? "Quiz Host" : "Student Member"}
                  </Badge>
                  {user.department && <Badge variant="secondary" className="text-xs">{user.department}</Badge>}
                  {user.year && <Badge variant="secondary" className="text-xs">Year {user.year}</Badge>}
                  {user.regNo && <Badge variant="outline" className="font-mono text-xs text-muted-foreground">{user.regNo}</Badge>}
                </div>
              </div>
            </div>

            {/* Quick Share Action */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyShareLink}
                className="gap-1.5 rounded-xl shadow-xs"
              >
                <Share2 className="h-4 w-4 text-brand-500" />
                Share Profile
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="container py-12 max-w-5xl space-y-10">
        {/* Level Progression Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-2 border-brand-500/20 bg-gradient-to-tr from-brand-500/5 via-card to-card shadow-lg">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Current Automation Rank</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="font-display text-3xl font-extrabold">Level {level}</p>
                    <span className="text-muted-foreground text-sm">({rankInfo.title})</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {level >= 40
                      ? "🌟 Eligible for official UiPath SDC Champion Cohort selection!"
                      : `${40 - level} levels remaining to reach Champion Status (Level 40)`}
                  </p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-amber-500 text-white shadow-lg shadow-brand-500/20">
                  <Sparkles className="h-7 w-7" />
                </div>
              </div>

              <div className="mt-6 space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-muted-foreground font-mono">
                    Current: {formatCoins(user.xp)} XP
                  </span>
                  <span className="text-brand-500 font-bold font-mono">
                    {Math.round(progress * 100)}% Progress
                  </span>
                </div>
                <Progress value={progress * 100} className="h-3 rounded-full bg-muted" />
                <div className="flex justify-between text-[11px] text-muted-foreground font-mono">
                  <span>Floor: {formatCoins(currentFloorXp)} XP</span>
                  <span>Target: {level >= 50 ? "MAX LEVEL 50" : `${formatCoins(nextLevelXp)} XP`}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((s, i) => {
            const Icon = s.icon;
            const val = user[s.key] ?? 0;
            return (
              <motion.div
                key={s.key}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 + i * 0.04 }}
              >
                <Card className="hover:border-brand-500/30 transition-all">
                  <CardContent className="flex items-center gap-4 p-5">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${s.bg} ${s.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-display text-2xl font-black text-foreground">{formatCoins(val)}</p>
                      <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Coin Transaction Ledger */}
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg font-bold">
                <History className="h-5 w-5 text-amber-500" />
                Coin History & Ledger
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Audit history of all coins earned through quizzes, challenges, and certifications.
              </p>
            </div>
            <div className="text-right">
              <Badge variant="outline" className="font-mono text-xs font-bold text-amber-500 border-amber-500/30 bg-amber-500/10">
                <Coins className="h-3 w-3 mr-1" /> {formatCoins(user.coins)} Coins
              </Badge>
            </div>
          </CardHeader>

          <CardContent>
            {loadingCoins ? (
              <div className="flex justify-center py-8">
                <Spinner className="h-6 w-6 text-amber-500" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="rounded-xl border border-dashed p-8 text-center bg-muted/20">
                <Coins className="mx-auto h-8 w-8 text-muted-foreground/60 mb-2" />
                <p className="text-sm font-semibold">No transactions recorded yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Complete quizzes and challenges to earn your first coins!
                </p>
              </div>
            ) : (
              <div className="divide-y max-h-80 overflow-y-auto pr-1">
                {transactions.slice(0, 15).map((tx) => {
                  const meta = getSourceMeta(tx.source);
                  const Icon = meta.icon;
                  const dateObj = toDate(tx.createdAt);
                  const isPositive = tx.amount >= 0;

                  return (
                    <div key={tx.id} className="flex items-center justify-between py-3 px-1 hover:bg-muted/20 rounded-lg transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${meta.color}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-xs sm:text-sm text-foreground truncate">
                            {tx.reason || meta.label}
                          </p>
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <span className="capitalize">{meta.label}</span>
                            {dateObj && (
                              <>
                                <span>·</span>
                                <span>{format(dateObj, "MMM dd, yyyy · p")}</span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0 pl-3">
                        <span
                          className={`font-mono text-xs sm:text-sm font-bold inline-flex items-center gap-1 ${
                            isPositive ? "text-emerald-500" : "text-rose-500"
                          }`}
                        >
                          {isPositive ? "+" : ""}
                          {formatCoins(tx.amount)} Coins
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Badges Earned */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                Badges Earned ({user.badges.length} of {BADGE_MAP.size})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {user.badges.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No badges earned yet. Complete quizzes and challenges to unlock badges!
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {user.badges.map((b) => {
                  const def = BADGE_MAP.get(b);
                  if (!def) return null;
                  return (
                    <div
                      key={b}
                      className={`flex items-center gap-3 rounded-xl border p-3.5 transition-all shadow-xs ${TIER_COLOR_CLASSES[def.tier]}`}
                    >
                      <div className="text-xl">🏅</div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate">{def.name}</p>
                        <p className="text-xs opacity-75 line-clamp-1">{def.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profile Details & Edit */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Academic & Profile Details
            </CardTitle>
            {!editing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  reset({
                    displayName: user.displayName,
                    department: (user.department as any) ?? undefined,
                    year: (user.year as any) ?? undefined,
                    regNo: user.regNo ?? undefined,
                    bio: user.bio ?? undefined,
                  });
                  setEditing(true);
                }}
                className="gap-1.5 rounded-xl"
              >
                <Edit className="h-3.5 w-3.5" />
                Edit Profile
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {editing ? (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input id="displayName" {...register("displayName")} className="mt-1" />
                    {errors.displayName && (
                      <p className="mt-1 text-xs text-destructive">{errors.displayName.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="regNo">Registration Number</Label>
                    <Input id="regNo" {...register("regNo")} className="mt-1" placeholder="e.g. 22CSBS01" />
                    {errors.regNo && (
                      <p className="mt-1 text-xs text-destructive">{errors.regNo.message}</p>
                    )}
                  </div>
                  <div>
                    <Label>Department</Label>
                    <Select
                      value={watch("department") ?? ""}
                      onValueChange={(v) => setValue("department", v as typeof DEPARTMENTS[number])}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEPARTMENTS.map((d) => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Year of Study</Label>
                    <Select
                      value={watch("year") ?? ""}
                      onValueChange={(v) => setValue("year", v as typeof YEARS[number])}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        {YEARS.map((y) => (
                          <SelectItem key={y} value={y}>{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="bio">Bio & Automation Interests</Label>
                  <Textarea id="bio" rows={3} {...register("bio")} className="mt-1" placeholder="Tell the community about your automation focus..." />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button type="submit" disabled={saving} className="gap-1.5">
                    {saving ? <Spinner className="text-white" /> : <Save className="h-4 w-4" />}
                    Save Changes
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setEditing(false)} className="gap-1.5">
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="rounded-xl border p-4 bg-muted/20">
                  <p className="text-xs text-muted-foreground font-semibold">Full Name</p>
                  <p className="font-bold text-base mt-0.5">{user.displayName}</p>
                </div>
                <div className="rounded-xl border p-4 bg-muted/20">
                  <p className="text-xs text-muted-foreground font-semibold">Registration No.</p>
                  <p className="font-bold text-base mt-0.5 font-mono">{user.regNo ?? "—"}</p>
                </div>
                <div className="rounded-xl border p-4 bg-muted/20">
                  <p className="text-xs text-muted-foreground font-semibold">Department</p>
                  <p className="font-bold text-base mt-0.5">{user.department ?? "—"}</p>
                </div>
                <div className="rounded-xl border p-4 bg-muted/20">
                  <p className="text-xs text-muted-foreground font-semibold">Year</p>
                  <p className="font-bold text-base mt-0.5">{user.year ? `Year ${user.year}` : "—"}</p>
                </div>
                {user.bio && (
                  <div className="sm:col-span-2 rounded-xl border p-4 bg-muted/20">
                    <p className="text-xs text-muted-foreground font-semibold">Bio</p>
                    <p className="text-sm mt-1 leading-relaxed">{user.bio}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

