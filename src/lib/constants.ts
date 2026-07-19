import type { BadgeDef } from "@/types";

export const SITE = {
  name: "UiZera Club",
  fullName: "UiZera Club — UiPath Community, PSNA CET",
  tagline: "Empowering the Next Generation of Automation Leaders",
  description:
    "The UiPath first Tamil community at PSNA College of Engineering & Technology. Quizzes, challenges, certifications, and a launchpad for RPA careers.",
  college: "PSNA College of Engineering & Technology",
  department: "Department of Computer Science and Business Systems",
  email: "uizera@psnacet.edu.in",
  location: "Dindigul, Tamil Nadu, India",
  social: {
    instagram: "https://www.instagram.com/psna_uizeraclub",
    linkedin: "https://www.linkedin.com/company/ui-zera-club-psnacet",
  },
  stats: {
    members: 100,
    events: 25,
    years: 3,
    certifications: 30,
  },
} as const;

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/events", label: "Events" },
  { href: "/announcements", label: "Announcements" },
  { href: "/achievements", label: "Achievements" },
  { href: "/champions", label: "Champions" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/resources", label: "Resources" },
  { href: "/team", label: "Team" },
  { href: "/contact", label: "Contact" },
] as const;

export const APP_LINKS = [
  { href: "/quiz", label: "Quizzes", icon: "Zap" },
  { href: "/challenges", label: "Challenges", icon: "Target" },
  { href: "/certifications", label: "30-Day Certs", icon: "Award" },
  { href: "/achievements", label: "Achievements", icon: "Award" },
  { href: "/champions", label: "Champions", icon: "Crown" },
  { href: "/leaderboard", label: "Leaderboard", icon: "Trophy" },
  { href: "/announcements", label: "Announcements", icon: "Megaphone" },
  { href: "/profile", label: "Profile", icon: "User" },
] as const;

export const BADGES: readonly BadgeDef[] = [
  { id: "first_quiz", name: "First Steps", description: "Completed your first quiz", icon: "Zap", tier: "bronze" },
  { id: "quiz_5", name: "Quiz Regular", description: "Completed 5 quizzes", icon: "Flame", tier: "silver" },
  { id: "quiz_10", name: "Quiz Master", description: "Completed 10 quizzes", icon: "Crown", tier: "gold" },
  { id: "perfect_score", name: "Flawless", description: "Scored 100% on a quiz", icon: "Sparkles", tier: "gold" },
  { id: "first_challenge", name: "Challenger", description: "First approved challenge submission", icon: "Target", tier: "bronze" },
  { id: "challenge_5", name: "Builder", description: "5 approved challenge submissions", icon: "Hammer", tier: "silver" },
  { id: "cert_7", name: "Week One Warrior", description: "7 certifications completed", icon: "Shield", tier: "bronze" },
  { id: "cert_15", name: "Halfway Hero", description: "15 certifications completed", icon: "Medal", tier: "silver" },
  { id: "cert_30", name: "Automation Legend", description: "All 30 certifications completed", icon: "Trophy", tier: "legend" },
  { id: "coins_100", name: "Coin Collector", description: "Earned 100 lifetime coins", icon: "Coins", tier: "bronze" },
  { id: "coins_500", name: "Treasure Hunter", description: "Earned 500 lifetime coins", icon: "Gem", tier: "silver" },
  { id: "coins_1000", name: "Vault Breaker", description: "Earned 1,000 lifetime coins", icon: "Landmark", tier: "gold" },
] as const;

export const BADGE_MAP: ReadonlyMap<string, BadgeDef> = new Map(
  BADGES.map((b) => [b.id, b])
);

export const DEPARTMENTS = [
  "CSBS",
  "CSE",
  "IT",
  "AI & DS",
  "ECE",
  "EEE",
  "MECH",
  "CIVIL",
  "Other",
] as const;

export const YEARS = ["I", "II", "III", "IV"] as const;

export const SESSION_COOKIE = "__session";
export const SESSION_DURATION_MS = 5 * 24 * 60 * 60 * 1000; // 5 days
