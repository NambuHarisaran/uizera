import type { Metadata } from "next";
import { ChallengesContent } from "./challenges-content";

export const metadata: Metadata = {
  title: "Weekly Challenges",
  description: "Complete weekly automation challenges, submit your work, and earn coins at UiZera Club.",
};

export default function ChallengesPage() {
  return <ChallengesContent />;
}
