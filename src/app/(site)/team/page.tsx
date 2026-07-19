import type { Metadata } from "next";
import { TeamContent } from "./team-content";

export const metadata: Metadata = {
  title: "Team",
  description: "Meet the faculty, coordinators, and core team behind UiZera Club at PSNA CET.",
};

export default function TeamPage() {
  return <TeamContent />;
}
