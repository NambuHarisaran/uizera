import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { FireTimestamp } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Normalize any Firestore/serialized timestamp shape to epoch millis. */
export function toMillis(ts: FireTimestamp): number {
  if (ts == null) return 0;
  if (typeof ts === "number") return ts;
  if (typeof ts === "string") return new Date(ts).getTime();
  if (ts instanceof Date) return ts.getTime();
  if ("seconds" in ts) return ts.seconds * 1000 + Math.floor(ts.nanoseconds / 1e6);
  if ("_seconds" in ts) return ts._seconds * 1000 + Math.floor(ts._nanoseconds / 1e6);
  return 0;
}

export function toDate(ts: FireTimestamp): Date | null {
  const ms = toMillis(ts);
  return ms > 0 ? new Date(ms) : null;
}

export function formatCoins(n: number): string {
  return new Intl.NumberFormat("en-IN").format(n);
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

/** Level curve: Max level is 50. level n requires 100·(n-1)² lifetime XP. */
export function levelForXp(xp: number): number {
  const calculated = Math.floor(Math.sqrt(Math.max(0, xp) / 100)) + 1;
  return Math.min(50, Math.max(1, calculated));
}

export function xpForLevel(level: number): number {
  const cl = Math.min(50, Math.max(1, level));
  return 100 * (cl - 1) * (cl - 1);
}

/** Progress (0..1) through the current level. Max level 50 stays at 1 (100%). */
export function levelProgress(xp: number): number {
  const level = levelForXp(xp);
  if (level >= 50) return 1;
  const floor = xpForLevel(level);
  const ceil = xpForLevel(level + 1);
  if (ceil === floor) return 1;
  return Math.min(1, Math.max(0, (xp - floor) / (ceil - floor)));
}

export type RankTitle = "Rookie" | "Coder" | "Expert" | "Master" | "Champion";

export function rankTitleForLevel(level: number): RankTitle {
  if (level >= 40) return "Champion";
  if (level >= 30) return "Master";
  if (level >= 20) return "Expert";
  if (level >= 10) return "Coder";
  return "Rookie";
}

export function rankStyleForLevel(level: number): { title: RankTitle; badgeClass: string } {
  const title = rankTitleForLevel(level);
  switch (title) {
    case "Champion":
      return {
        title,
        badgeClass: "border-amber-500/50 bg-amber-500/15 text-amber-500 font-extrabold animate-pulse ring-1 ring-amber-500/30",
      };
    case "Master":
      return {
        title,
        badgeClass: "border-purple-500/50 bg-purple-500/15 text-purple-400 font-bold",
      };
    case "Expert":
      return {
        title,
        badgeClass: "border-emerald-500/50 bg-emerald-500/15 text-emerald-500 font-bold",
      };
    case "Coder":
      return {
        title,
        badgeClass: "border-blue-500/50 bg-blue-500/15 text-blue-500 font-medium",
      };
    case "Rookie":
    default:
      return {
        title,
        badgeClass: "border-slate-500/40 bg-slate-500/10 text-slate-400 font-medium",
      };
  }
}

export function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}

/** Fisher–Yates shuffle returning a NEW array (crypto-quality not required here). */
export function shuffle<T>(arr: readonly T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}
