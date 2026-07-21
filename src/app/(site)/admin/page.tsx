"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Award,
  Coins,
  FileText,
  Megaphone,
  Plus,
  ShieldAlert,
  Target,
  Users,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/shared/spinner";
import { useAdminUsers, useAdminQuizzes, useAdminChallenges } from "@/lib/hooks";
import { formatCoins } from "@/lib/utils";

export default function AdminDashboardPage() {
  const { data: usersData, isLoading: loadingUsers } = useAdminUsers();
  const { data: quizzesData, isLoading: loadingQuizzes } = useAdminQuizzes();
  const { data: challengesData, isLoading: loadingChallenges } = useAdminChallenges();

  const users = usersData?.users ?? [];
  const quizzes = quizzesData?.quizzes ?? [];
  const challenges = challengesData?.challenges ?? [];

  const totalCoinsDistributed = users.reduce((sum, u) => sum + (u.coins ?? 0), 0);
  const activeQuizzes = quizzes.filter((q) => q.status === "live").length;
  const openChallenges = challenges.filter((c) => c.status === "open").length;

  const isLoading = loadingUsers || loadingQuizzes || loadingChallenges;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of platform activity, user management, and core operations.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner className="h-8 w-8" />
        </div>
      ) : (
        <>
          {/* Quick Metrics */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-brand-500">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-display text-2xl font-bold">{users.length}</p>
                  <p className="text-xs text-muted-foreground">Registered Users</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                  <Coins className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-display text-2xl font-bold">
                    {formatCoins(totalCoinsDistributed)}
                  </p>
                  <p className="text-xs text-muted-foreground">Coins Distributed</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-display text-2xl font-bold">{activeQuizzes}</p>
                  <p className="text-xs text-muted-foreground">Active Quizzes</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-display text-2xl font-bold">{openChallenges}</p>
                  <p className="text-xs text-muted-foreground">Open Challenges</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="transition-all hover:border-brand-500/30">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-semibold">User Management</CardTitle>
                <Users className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  View users, grant admin roles, or disable non-compliant accounts.
                </p>
                <Button asChild size="sm" className="w-full">
                  <Link href="/admin/users">Manage Users</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="transition-all hover:border-brand-500/30">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-semibold">Quiz Creator</CardTitle>
                <Zap className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Build new MCQ & image quizzes, schedule start/end dates, assign coin points.
                </p>
                <Button asChild size="sm" className="w-full">
                  <Link href="/admin/quizzes">Manage Quizzes</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="transition-all hover:border-brand-500/30">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-semibold">Weekly Challenges</CardTitle>
                <Target className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Create new weekly challenges and review student solution submissions.
                </p>
                <Button asChild size="sm" className="w-full">
                  <Link href="/admin/challenges">Manage Challenges</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="transition-all hover:border-brand-500/30">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-semibold">30-Day Certification</CardTitle>
                <Award className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Verify reported student daily milestones or bulk-approve certs.
                </p>
                <Button asChild size="sm" className="w-full">
                  <Link href="/admin/certifications">Verify Certifications</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="transition-all hover:border-brand-500/30">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-semibold">Award Coins</CardTitle>
                <Coins className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Manually grant coins for special activities, workshops, or course completions.
                </p>
                <Button asChild size="sm" className="w-full">
                  <Link href="/admin/coins">Award Coins</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="transition-all hover:border-brand-500/30">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-semibold">Content & Site Data</CardTitle>
                <FileText className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Manage events, resources, gallery images, team members, and announcements.
                </p>
                <Button asChild size="sm" className="w-full">
                  <Link href="/admin/content">Manage Content</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
