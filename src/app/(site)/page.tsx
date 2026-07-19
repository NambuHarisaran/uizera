import type { Metadata } from "next";
import { HeroSection } from "@/components/landing/hero";
import { StatsBar } from "@/components/landing/stats-bar";
import { WhyRpaSection } from "@/components/landing/why-rpa";
import { UiPathSection } from "@/components/landing/uipath-section";
import { CommunityMission } from "@/components/landing/community-mission";
import { Testimonials } from "@/components/landing/testimonials";
import { FaqSection } from "@/components/landing/faq";
import { CtaSection } from "@/components/landing/cta-section";

export const metadata: Metadata = {
  title: "UI Zera Club — Empowering the Next Generation of Automation Leaders",
  description:
    "The UiPath first Tamil community at PSNA College of Engineering & Technology. Quizzes, challenges, certifications, and a launchpad for RPA careers.",
};

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <StatsBar />
      <WhyRpaSection />
      <UiPathSection />
      <CommunityMission />
      <Testimonials />
      <FaqSection />
      <CtaSection />
    </>
  );
}
