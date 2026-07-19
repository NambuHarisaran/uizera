import type { Metadata } from "next";
import { AboutContent } from "./about-content";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about UiZera Club — the UiPath first Tamil community at PSNA CET. Our mission, vision, and the story behind the movement.",
};

export default function AboutPage() {
  return <AboutContent />;
}
