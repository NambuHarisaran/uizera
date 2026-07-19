"use client";

import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SectionHeading } from "@/components/shared/section-heading";

const faqs = [
  {
    q: "Who can join UI Zera Club?",
    a: "Any student at PSNA College of Engineering & Technology can join, regardless of department or year. All you need is a Google account and enthusiasm for automation!",
  },
  {
    q: "Do I need programming experience?",
    a: "Not at all! UiPath Studio provides a visual, drag-and-drop interface. We start from the basics and guide you step by step. Many of our top performers started with zero coding experience.",
  },
  {
    q: "What is the 30-Day Certification Program?",
    a: "It's an intensive one-month sprint where you complete one UiPath certification or learning milestone every day. Coordinators verify your progress and you earn coins for each completion.",
  },
  {
    q: "How do coins work?",
    a: "Coins are our internal reward currency. You earn them by completing quizzes, weekly challenges, certifications, and special activities. Coins feed into the leaderboard and unlock achievement badges.",
  },
  {
    q: "Are the quizzes timed?",
    a: "Yes! Each quiz has a configurable timer set by the admin. Questions and options can be randomized to keep things fair and challenging.",
  },
  {
    q: "Can I access this on my phone?",
    a: "Absolutely. The entire platform is fully responsive and works beautifully on phones, tablets, and desktops.",
  },
  {
    q: "Is this platform affiliated with UiPath?",
    a: "UI Zera Club is a student-run community inspired by UiPath's mission. While we use UiPath technologies, we are an independent student community at PSNA CET.",
  },
  {
    q: "How do I become a coordinator?",
    a: "Coordinators are selected by the core team based on their community contributions, participation, and leadership. Active members who demonstrate consistent engagement are typically invited.",
  },
];

export function FaqSection() {
  return (
    <section className="relative overflow-hidden bg-uipath-bg py-24 dark:bg-background">
      <div className="bg-blueprint pointer-events-none absolute inset-0" />
      <div className="container relative max-w-3xl">
        <SectionHeading
          badge="FAQ"
          title="Frequently Asked Questions"
          description="Got questions? We've got answers."
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-12"
        >
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="border border-uipath-text/10 bg-white px-5 shadow-sm transition-colors data-[state=open]:border-uipath-orange/50 dark:border-border dark:bg-card"
              >
                <AccordionTrigger className="gap-4 py-4 text-left font-display text-sm font-semibold hover:no-underline sm:text-base">
                  <span className="flex items-center gap-4">
                    <span className="shrink-0 font-mono text-xs font-bold text-uipath-orange">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {faq.q}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-4 pl-10 text-sm leading-relaxed text-muted-foreground">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
