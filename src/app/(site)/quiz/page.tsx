import type { Metadata } from "next";
import { QuizListContent } from "./quiz-list-content";

export const metadata: Metadata = {
  title: "Quizzes",
  description: "Take timed quizzes, earn coins, and climb the leaderboard at UiZera Club.",
};

export default function QuizListPage() {
  return <QuizListContent />;
}
