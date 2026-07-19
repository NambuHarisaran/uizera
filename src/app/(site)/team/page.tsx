import type { Metadata } from "next";
import { TeamContent } from "./team-content";

export const metadata: Metadata = {
  title: "Team",
  description: "Meet the faculty, coordinators, and core team behind UI Zera Club at PSNA CET.",
};

export default function TeamPage() {
  return <TeamContent />;
}
