import type { Metadata } from "next";
import { EventsContent } from "./events-content";

export const metadata: Metadata = {
  title: "Events",
  description: "Upcoming and past events organized by UI Zera Club at PSNA CET — workshops, hackathons, webinars, and more.",
};

export default function EventsPage() {
  return <EventsContent />;
}
