import type { Metadata } from "next";
import { AnnouncementsContent } from "./announcements-content";

export const metadata: Metadata = {
  title: "Announcements",
  description: "Latest announcements and updates from UI Zera Club at PSNA CET.",
};

export default function AnnouncementsPage() {
  return <AnnouncementsContent />;
}
