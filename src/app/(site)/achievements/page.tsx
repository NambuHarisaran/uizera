import type { Metadata } from "next";
import { AchievementsContent } from "./achievements-content";

export const metadata: Metadata = {
  title: "Achievements & Quests",
  description: "Track your XP, level up (Max Level 50), complete quests, and collect badges in UiZera Club.",
};

export default function AchievementsPage() {
  return <AchievementsContent />;
}
