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

/** Level curve shared with Cloud Functions: level n needs 100·n² lifetime XP. */
export function levelForXp(xp: number): number {
  return Math.max(1, Math.floor(Math.sqrt(Math.max(0, xp) / 100)) + 1);
}

export function xpForLevel(level: number): number {
  return 100 * (level - 1) * (level - 1);
}

/** Progress (0..1) through the current level. */
export function levelProgress(xp: number): number {
  const level = levelForXp(xp);
  const floor = xpForLevel(level);
  const ceil = xpForLevel(level + 1);
  if (ceil === floor) return 1;
  return Math.min(1, Math.max(0, (xp - floor) / (ceil - floor)));
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
