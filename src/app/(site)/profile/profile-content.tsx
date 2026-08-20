"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Award,
  Coins,
  Edit,
  Save,
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
import { profileUpdateSchema } from "@/lib/validation";
import { formatCoins, initials, levelForXp, levelProgress, xpForLevel } from "@/lib/utils";
import type { z } from "zod";

type ProfileForm = z.infer<typeof profileUpdateSchema>;

const statCards = [
  { key: "coins", label: "Total Coins", icon: Coins, color: "text-amber-500" },
  { key: "quizzesTaken", label: "Quizzes Taken", icon: Zap, color: "text-brand-500" },
  { key: "challengesApproved", label: "Challenges Done", icon: Target, color: "text-emerald-500" },
  { key: "certsCompleted", label: "Certs Completed", icon: Award, color: "text-violet-500" },
] as const;

export function ProfileContent() {
  const { user, loading, refreshUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

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
      toast.success("Profile updated!");
      setEditing(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };


  if (loading || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const level = levelForXp(user.xp);
  const progress = levelProgress(user.xp);
  const nextLevelXp = xpForLevel(level + 1);

  return (
    <div className="pb-24">
      {/* Header */}
      <section className="hero-glow relative overflow-hidden py-24">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-20" />
        <div className="container relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center gap-6 sm:flex-row sm:items-start"
          >
            <Avatar className="h-24 w-24 shrink-0 border-4 border-brand-500/30 shadow-xl">
              <AvatarImage src={user.photoURL ?? undefined} alt={user.displayName} />
              <AvatarFallback className="bg-uipath-orange/15 font-display text-2xl text-uipath-orange">
                {initials(user.displayName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 max-w-full text-center sm:text-left">
              <h1 className="truncate font-display text-3xl font-bold" title={user.displayName}>
                {user.displayName}
              </h1>
              <p className="mt-1 truncate text-muted-foreground" title={user.email}>
                {user.email}
              </p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <Badge variant="outline" className="gap-1">
                  <Shield className="h-3 w-3" />
                  {user.role === "super_admin" ? "Super Admin" : user.role === "admin" ? "Admin" : "Student"}
                </Badge>
                {user.department && <Badge variant="secondary">{user.department}</Badge>}
                {user.year && <Badge variant="secondary">Year {user.year}</Badge>}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="container py-12">
        <div className="mx-auto max-w-5xl space-y-8">
          {/* Level Card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Current Level</p>
                    <p className="font-display text-3xl font-bold">Level {level}</p>
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-uipath-orange text-white shadow-lg">
                    <Sparkles className="h-7 w-7" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                    <span>{formatCoins(user.xp)} XP</span>
                    <span>{formatCoins(nextLevelXp)} XP</span>
                  </div>
                  <Progress value={progress * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map((s, i) => {
              const Icon = s.icon;
              const val = user[s.key] ?? 0;
              return (
                <motion.div
                  key={s.key}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.05 }}
                >
                  <Card>
                    <CardContent className="flex items-center gap-4 p-5">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-current/10 ${s.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-display text-2xl font-bold">{formatCoins(val)}</p>
                        <p className="text-xs text-muted-foreground">{s.label}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Badges */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                Badges ({user.badges.length})
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
                        className={`flex items-center gap-3 rounded-lg border p-3 ${TIER_COLOR_CLASSES[def.tier]}`}
                      >
                        <div className="text-lg">🏅</div>
                        <div>
                          <p className="text-sm font-semibold">{def.name}</p>
                          <p className="text-xs opacity-70">{def.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Edit Profile */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Details
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
                  className="gap-1.5"
                >
                  <Edit className="h-3.5 w-3.5" />
                  Edit
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
                      <Label htmlFor="regNo">Registration No.</Label>
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
                      <Label>Year</Label>
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
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea id="bio" rows={3} {...register("bio")} className="mt-1" placeholder="Tell us about yourself..." />
                  </div>
                  <div className="flex gap-2">
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
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Name</p>
                    <p className="font-medium">{user.displayName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Registration No.</p>
                    <p className="font-medium">{user.regNo ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Department</p>
                    <p className="font-medium">{user.department ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Year</p>
                    <p className="font-medium">{user.year ?? "—"}</p>
                  </div>
                  {user.bio && (
                    <div className="sm:col-span-2">
                      <p className="text-xs text-muted-foreground">Bio</p>
                      <p className="font-medium">{user.bio}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
