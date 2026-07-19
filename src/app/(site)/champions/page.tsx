import type { Metadata } from "next";
import { ChampionsContent } from "./champions-content";

export const metadata: Metadata = {
  title: "UiPath Champions — Next Gen Selection",
  description: "Hall of fame for Level 40+ Champions. Top 10 Champions are eligible to apply for the next UiPath Student Developer Champion cohort.",
};

export default function ChampionsPage() {
  return <ChampionsContent />;
}
