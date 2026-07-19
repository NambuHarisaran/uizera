import type { Metadata } from "next";
import { LeaderboardContent } from "./leaderboard-content";

export const metadata: Metadata = {
  title: "Leaderboard",
  description: "See who's leading the UI Zera community — weekly, monthly, and overall rankings.",
};

export default function LeaderboardPage() {
  return <LeaderboardContent />;
}
