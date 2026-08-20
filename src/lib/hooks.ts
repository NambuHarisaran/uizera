"use client";

/**
 * TanStack Query hooks — the single data-fetching layer for every page.
 *
 * Each hook wraps a `fetcher()` call with proper cache keys, stale times,
 * and error handling. The `fetcher` already handles JSON parsing, status
 * checks, and returns the unwrapped `data` field from the API envelope.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetcher, postJson, unwrap } from "@/lib/fetcher";
import type {
  AppUser,
  LeaderboardEntry,
  LeaderboardPeriod,
  Quiz,
  QuizAttempt,
  QuizReviewItem,
  Challenge,
  ChallengeSubmission,
  CertDay,
  CertProgress,
  CoinTransaction,
  Announcement,
  CommunityEvent,
  LearningResource,
  GalleryItem,
  TeamMember,
  Quest,
} from "@/types";

// ── Keys ────────────────────────────────────────────────────────────────────

export const queryKeys = {
  leaderboard: (period: LeaderboardPeriod) => ["leaderboard", period] as const,
  quizzes: ["quizzes"] as const,
  quiz: (id: string) => ["quiz", id] as const,
  quizLeaderboard: (id: string) => ["quizLeaderboard", id] as const,
  quizReview: (id: string, attemptId: string) => ["quizReview", id, attemptId] as const,
  challenges: ["challenges"] as const,
  challenge: (id: string) => ["challenge", id] as const,
  mySubmissions: ["mySubmissions"] as const,
  certProgram: ["certProgram"] as const,
  certProgress: ["certProgress"] as const,
  profile: ["profile"] as const,
  coinHistory: ["coinHistory"] as const,
  events: ["events"] as const,
  announcements: ["announcements"] as const,
  resources: ["resources"] as const,
  team: ["team"] as const,
  gallery: ["gallery"] as const,
  achievements: ["achievements"] as const,
  // Admin
  adminUsers: ["admin", "users"] as const,
  adminQuizzes: ["admin", "quizzes"] as const,
  adminChallenges: ["admin", "challenges"] as const,
  adminSubmissions: (challengeId?: string) => ["admin", "submissions", challengeId] as const,
  adminCertProgress: ["admin", "certProgress"] as const,
  adminAuditLogs: ["admin", "auditLogs"] as const,
} as const;

// ── Public data ─────────────────────────────────────────────────────────────

export function useLeaderboard(period: LeaderboardPeriod = "overall") {
  return useQuery({
    queryKey: queryKeys.leaderboard(period),
    queryFn: () =>
      fetcher<{ entries: LeaderboardEntry[] }>(`/api/leaderboard?period=${period}`),
    staleTime: 30_000,
  });
}

export function useEvents() {
  return useQuery({
    queryKey: queryKeys.events,
    queryFn: () => fetcher<{ events: CommunityEvent[] }>("/api/content/events"),
    staleTime: 60_000,
  });
}

export function useAnnouncements() {
  return useQuery({
    queryKey: queryKeys.announcements,
    queryFn: () => fetcher<{ items: Announcement[] }>("/api/content/announcements"),
    staleTime: 60_000,
  });
}

export function useResources() {
  return useQuery({
    queryKey: queryKeys.resources,
    queryFn: () => fetcher<{ items: LearningResource[] }>("/api/content/resources"),
    staleTime: 120_000,
  });
}

export function useTeam() {
  return useQuery({
    queryKey: queryKeys.team,
    queryFn: () => fetcher<{ items: TeamMember[] }>("/api/content/team"),
    staleTime: 300_000,
  });
}

export function useGallery() {
  return useQuery({
    queryKey: queryKeys.gallery,
    queryFn: () => fetcher<{ items: GalleryItem[] }>("/api/content/gallery"),
    staleTime: 300_000,
  });
}

// ── Quizzes ─────────────────────────────────────────────────────────────────

export function useQuizzes() {
  return useQuery({
    queryKey: queryKeys.quizzes,
    queryFn: () => fetcher<{ quizzes: Quiz[] }>("/api/quiz"),
    staleTime: 30_000,
  });
}

export function useQuiz(quizId: string) {
  return useQuery({
    queryKey: queryKeys.quiz(quizId),
    queryFn: () => fetcher<{ quiz: Quiz; attempt: QuizAttempt | null }>(`/api/quiz/${quizId}`),
    staleTime: 10_000,
    enabled: !!quizId,
  });
}

export function useQuizLeaderboard(quizId: string) {
  return useQuery({
    queryKey: queryKeys.quizLeaderboard(quizId),
    queryFn: () =>
      fetcher<{ entries: QuizAttempt[] }>(`/api/quiz/${quizId}/leaderboard`),
    staleTime: 15_000,
    enabled: !!quizId,
  });
}

export function useQuizReview(quizId: string, attemptId: string) {
  return useQuery({
    queryKey: queryKeys.quizReview(quizId, attemptId),
    queryFn: () =>
      fetcher<{ items: QuizReviewItem[]; attempt: QuizAttempt }>(
        `/api/quiz/${quizId}/review?attemptId=${attemptId}`
      ),
    enabled: !!quizId && !!attemptId,
    staleTime: Infinity,
  });
}

// ── Challenges ──────────────────────────────────────────────────────────────

export function useChallenges() {
  return useQuery({
    queryKey: queryKeys.challenges,
    queryFn: () =>
      fetcher<{ challenges: Challenge[]; submissions: ChallengeSubmission[] }>(
        "/api/challenges"
      ),
    staleTime: 30_000,
  });
}

// ── Certifications ──────────────────────────────────────────────────────────

export function useCertProgram() {
  return useQuery({
    queryKey: queryKeys.certProgram,
    queryFn: () => fetcher<{ days: CertDay[] }>("/api/certifications"),
    staleTime: 120_000,
  });
}

export function useCertProgress() {
  return useQuery({
    queryKey: queryKeys.certProgress,
    queryFn: () => fetcher<{ progress: CertProgress }>("/api/certifications/progress"),
    staleTime: 30_000,
  });
}

// ── Profile ─────────────────────────────────────────────────────────────────

export function useCoinHistory() {
  return useQuery({
    queryKey: queryKeys.coinHistory,
    queryFn: () => fetcher<{ transactions: CoinTransaction[] }>("/api/profile/coins"),
    staleTime: 30_000,
  });
}

// ── Admin ───────────────────────────────────────────────────────────────────

export function useAdminUsers() {
  return useQuery({
    queryKey: queryKeys.adminUsers,
    queryFn: () => fetcher<{ users: AppUser[] }>("/api/admin/users"),
    staleTime: 15_000,
  });
}

export function useAdminQuizzes() {
  return useQuery({
    queryKey: queryKeys.adminQuizzes,
    queryFn: () => fetcher<{ quizzes: Quiz[] }>("/api/admin/quizzes"),
    staleTime: 15_000,
  });
}

export function useAdminChallenges() {
  return useQuery({
    queryKey: queryKeys.adminChallenges,
    queryFn: () =>
      fetcher<{ challenges: Challenge[] }>("/api/admin/challenges"),
    staleTime: 15_000,
  });
}

export function useAdminSubmissions(challengeId?: string) {
  return useQuery({
    queryKey: queryKeys.adminSubmissions(challengeId),
    queryFn: () => {
      const url = challengeId
        ? `/api/admin/submissions?challengeId=${encodeURIComponent(challengeId)}`
        : "/api/admin/submissions";
      return fetcher<{ submissions: ChallengeSubmission[] }>(url);
    },
    enabled: challengeId !== undefined ? Boolean(challengeId) : true,
    staleTime: 15_000,
  });
}


// ── Achievements & Quests ───────────────────────────────────────────────────

export function useAchievements() {
  return useQuery({
    queryKey: queryKeys.achievements,
    queryFn: () =>
      fetcher<{
        xp: number;
        level: number;
        progress: number;
        currentLevelFloor: number;
        nextLevelXp: number;
        badges: string[];
        quests: Quest[];
      }>("/api/achievements"),
    staleTime: 10_000,
  });
}

export function useClaimQuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (questId: string) => {
      const res = await postJson<{ newCoins: number; xpAwarded: number; coinsAwarded: number }>("/api/achievements/claim", { questId });
      return unwrap(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.achievements });
      queryClient.invalidateQueries({ queryKey: queryKeys.profile });
    },
  });
}
