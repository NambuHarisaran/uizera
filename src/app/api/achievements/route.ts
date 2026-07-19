import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { handleApi, jsonOk, requireUser } from "@/lib/server/api";
import { levelForXp, levelProgress, xpForLevel } from "@/lib/utils";
import type { AppUser, Quest } from "@/types";

export const runtime = "nodejs";

export async function GET(_req: NextRequest) {
  return handleApi(async () => {
    const user = await requireUser();
    const db = adminDb();
    const snap = await db.collection("users").doc(user.uid).get();
    const profile = (snap.data() as AppUser) || {
      xp: 0,
      level: 1,
      quizzesTaken: 0,
      challengesApproved: 0,
      certsCompleted: 0,
      coins: 0,
      badges: [],
    };

    const claimedSnap = await db
      .collection("users")
      .doc(user.uid)
      .collection("claimedQuests")
      .get();
    const claimedIds = new Set(claimedSnap.docs.map((d) => d.id));

    const currentXp = profile.xp ?? 0;
    const currentLevel = levelForXp(currentXp);
    const progress = levelProgress(currentXp);
    const nextLevelXp = currentLevel >= 50 ? xpForLevel(50) : xpForLevel(currentLevel + 1);
    const currentLevelFloor = xpForLevel(currentLevel);

    // Dynamic quest definition list
    const questDefs: Omit<Quest, "completed" | "claimed">[] = [
      {
        id: "daily_quiz",
        title: "Daily Automation Quiz",
        description: "Complete at least 1 quiz to stay sharp.",
        rewardXp: 50,
        rewardCoins: 25,
        category: "daily",
        icon: "Zap",
        current: Math.min(1, profile.quizzesTaken ?? 0),
        target: 1,
      },
      {
        id: "quiz_apprentice",
        title: "Quiz Apprentice",
        description: "Complete 5 quizzes across any topic.",
        rewardXp: 150,
        rewardCoins: 75,
        category: "lifetime",
        icon: "Flame",
        current: Math.min(5, profile.quizzesTaken ?? 0),
        target: 5,
      },
      {
        id: "quiz_grandmaster",
        title: "Quiz Grandmaster",
        description: "Complete 10 quizzes and test your knowledge.",
        rewardXp: 300,
        rewardCoins: 150,
        category: "lifetime",
        icon: "Crown",
        current: Math.min(10, profile.quizzesTaken ?? 0),
        target: 10,
      },
      {
        id: "first_challenge",
        title: "First Code Challenge",
        description: "Submit 1 approved weekly automation challenge.",
        rewardXp: 200,
        rewardCoins: 100,
        category: "lifetime",
        icon: "Target",
        current: Math.min(1, profile.challengesApproved ?? 0),
        target: 1,
      },
      {
        id: "cert_sprint",
        title: "Cert Sprint",
        description: "Complete 5 days of the 30-Day Certification Program.",
        rewardXp: 250,
        rewardCoins: 120,
        category: "lifetime",
        icon: "Shield",
        current: Math.min(5, profile.certsCompleted ?? 0),
        target: 5,
      },
      {
        id: "reach_level_5",
        title: "Rising Star (Level 5)",
        description: "Reach Level 5 in UiZera Club.",
        rewardXp: 400,
        rewardCoins: 200,
        category: "lifetime",
        icon: "Trophy",
        current: Math.min(5, currentLevel),
        target: 5,
      },
      {
        id: "reach_level_10",
        title: "Automation Veteran (Level 10)",
        description: "Reach Level 10 in UiZera Club.",
        rewardXp: 800,
        rewardCoins: 400,
        category: "lifetime",
        icon: "Award",
        current: Math.min(10, currentLevel),
        target: 10,
      },
    ];

    const quests: Quest[] = questDefs.map((q) => {
      const completed = q.current >= q.target;
      const claimed = claimedIds.has(q.id);
      return {
        ...q,
        completed,
        claimed,
      };
    });

    return jsonOk({
      xp: currentXp,
      level: currentLevel,
      progress,
      currentLevelFloor,
      nextLevelXp,
      badges: profile.badges ?? [],
      quests,
    });
  });
}
