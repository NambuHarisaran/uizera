"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SectionHeading } from "@/components/shared/section-heading";
import { Search, HelpCircle, MessageSquare, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

const CATEGORIES = ["All", "Getting Started", "Certifications & Rewards", "Technical & Platform"] as const;

const faqs = [
  {
    category: "Getting Started",
    q: "Who can join UiZera Club?",
    a: "Any student enrolled at PSNA College of Engineering & Technology can join, regardless of department or year. All you need is a valid student Google account and enthusiasm for automation!",
  },
  {
    category: "Getting Started",
    q: "Do I need prior programming experience?",
    a: "Not at all! UiPath Studio provides a visual, drag-and-drop workflow canvas. We start from absolute basics and mentor you step by step. Many of our top performers started with zero coding experience.",
  },
  {
    category: "Certifications & Rewards",
    q: "What is the 30-Day Certification Program?",
    a: "It is an intensive, structured 1-month sprint where you complete curated UiPath Academy courses and learning milestones daily. Chapter coordinators review your progress and award gold coins for verified completions.",
  },
  {
    category: "Certifications & Rewards",
    q: "How do gold coins and bounties work?",
    a: "Coins are our verifiable community reward currency. You earn them by completing quizzes, weekly challenges, certification milestones, and peer contributions. Coins power the leaderboard and unlock exclusive achievement badges.",
  },
  {
    category: "Technical & Platform",
    q: "Are the quizzes timed with anti-cheat?",
    a: "Yes! Each quiz has a live countdown timer set by coordinators. Questions and options are randomized for each attempt to ensure a fair and competitive environment.",
  },
  {
    category: "Technical & Platform",
    q: "Can I access UiZera on my phone?",
    a: "Absolutely. The entire web platform is optimized for mobile, tablet, and desktop devices so you can take quizzes and track your sprint progress anywhere.",
  },
  {
    category: "Getting Started",
    q: "Is this platform affiliated with UiPath?",
    a: "UiZera Club is an independent student-led community chapter at PSNA CET inspired by UiPath's global mission. We use official UiPath technologies, academy curricula, and tools to train students.",
  },
  {
    category: "Getting Started",
    q: "How do I become a student coordinator?",
    a: "Coordinators are selected by the core leadership based on consistent quiz performance, active community contributions, and leadership initiative. High-ranking members on the leaderboard are invited each semester.",
  },
];

export function FaqSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const filteredFaqs = useMemo(() => {
    return faqs.filter((faq) => {
      const matchesCategory =
        selectedCategory === "All" || faq.category === selectedCategory;
      const matchesSearch =
        faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.a.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <section className="relative overflow-hidden bg-uipath-bg py-24 sm:py-28 dark:bg-background">
      <div className="bg-blueprint pointer-events-none absolute inset-0 opacity-50" />

      <div className="container relative mx-auto max-w-4xl px-4 sm:px-6">
        <SectionHeading
          badge="Knowledge Base"
          title="Frequently Asked Questions"
          description="Everything you need to know about joining UiZera, earning coins, and mastering automation."
        />

        {/* Search & Category Filter Bar */}
        <div className="mt-10 flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search questions (e.g. quizzes, certification, coins)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-uipath-text/15 bg-white/90 py-3.5 pl-11 pr-4 text-sm font-medium text-foreground placeholder:text-muted-foreground/70 shadow-sm backdrop-blur-md transition-all focus:border-uipath-orange focus:outline-none focus:ring-2 focus:ring-uipath-orange/20 dark:border-border dark:bg-card/90"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:bg-muted"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-lg px-3 py-1.5 font-mono text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                  selectedCategory === cat
                    ? "bg-uipath-orange text-white shadow-md shadow-uipath-orange/20"
                    : "border border-border/80 bg-white/80 dark:bg-card/80 text-muted-foreground hover:text-foreground hover:border-foreground/30"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Accordion list */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-8"
        >
          {filteredFaqs.length > 0 ? (
            <Accordion type="single" collapsible className="space-y-3">
              {filteredFaqs.map((faq, i) => (
                <AccordionItem
                  key={faq.q}
                  value={`faq-${i}`}
                  className="group relative overflow-hidden rounded-xl border border-uipath-text/15 bg-white/95 px-5 shadow-sm backdrop-blur-md transition-all duration-200 data-[state=open]:border-uipath-orange/60 data-[state=open]:shadow-md dark:border-border dark:bg-card/95"
                >
                  <AccordionTrigger className="gap-4 py-4 text-left font-display text-base sm:text-lg font-bold text-uipath-text transition-colors group-hover:text-uipath-orange dark:text-foreground hover:no-underline">
                    <span className="flex items-center gap-3.5">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-uipath-orange/10 font-mono text-xs font-extrabold text-uipath-orange dark:bg-uipath-orange/20">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span>{faq.q}</span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-5 pl-10 text-sm sm:text-base leading-relaxed text-muted-foreground">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-white/50 dark:bg-card/50 p-10 text-center">
              <HelpCircle className="h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="font-display text-base font-semibold text-foreground">
                No matching questions found
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Try searching for something else or contact our chapter coordinators.
              </p>
            </div>
          )}
        </motion.div>

        {/* Quick Help Callout Box */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-uipath-blue/30 bg-blue-500/5 dark:bg-blue-950/20 p-5 sm:p-6 backdrop-blur-md">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-uipath-blue text-white shadow-sm">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-display text-base font-bold text-foreground">
                Have a different question?
              </h4>
              <p className="text-xs text-muted-foreground">
                Our coordinators are ready to help you get started with UiPath.
              </p>
            </div>
          </div>

          <Link
            href="/contact"
            className="group inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2.5 font-mono text-xs font-bold text-background transition-all hover:bg-uipath-orange hover:text-white"
          >
            <span>Ask Chapter Coordinator</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}

