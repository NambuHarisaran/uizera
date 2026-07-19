"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  BookOpen,
  Coins,
  MessageCircle,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/shared/section-heading";
import { Magnetic } from "@/components/shared/magnetic";
import { Parallax } from "@/components/shared/parallax";

const benefits = [
  {
    icon: Zap,
    title: "Interactive Quizzes",
    description:
      "Test your knowledge with timed quizzes and earn coins for every correct answer. Randomized questions keep every attempt fresh and fair.",
    iconBg: "bg-uipath-orange",
    span: "sm:col-span-2",
  },
  {
    icon: Target,
    title: "Weekly Challenges",
    description: "Push your limits with hands-on automation challenges reviewed by experts.",
    iconBg: "bg-uipath-blue",
    span: "",
  },
  {
    icon: Award,
    title: "30-Day Certification",
    description: "Complete a structured 30-day certification sprint with guided daily milestones.",
    iconBg: "bg-uipath-gold",
    span: "",
  },
  {
    icon: Trophy,
    title: "Leaderboard & Badges",
    description: "Compete with peers, climb the leaderboard, and unlock achievement badges.",
    iconBg: "bg-uipath-orange",
    span: "",
  },
  {
    icon: Coins,
    title: "Earn Coins",
    description: "Every quiz, challenge, and certification earns you coins — your progress made visible.",
    iconBg: "bg-uipath-gold",
    span: "",
  },
  {
    icon: BookOpen,
    title: "Curated Resources",
    description: "Access hand-picked learning materials, videos, and documentation to accelerate your journey.",
    iconBg: "bg-uipath-blue",
    span: "",
  },
  {
    icon: MessageCircle,
    title: "Community Support",
    description:
      "Learn together with peers, get help from coordinators, and grow as a team. Nobody automates alone.",
    iconBg: "bg-uipath-success",
    span: "sm:col-span-2 lg:col-span-1",
  },
];

export function CommunityMission() {
  return (
    <section className="relative overflow-hidden bg-uipath-bg py-24 dark:bg-background">
      <div className="bg-blueprint pointer-events-none absolute inset-0" />

      <Parallax speed={55} className="pointer-events-none absolute right-[4%] top-[12%]">
        <div className="h-12 w-12 rotate-45 border-2 border-uipath-orange/30" />
      </Parallax>
      <Parallax speed={-40} className="pointer-events-none absolute left-[6%] bottom-[15%]">
        <div className="h-7 w-7 bg-uipath-gold/30" />
      </Parallax>

      <div className="container relative mx-auto max-w-6xl">
        <SectionHeading
          badge="Our Mission"
          title="Why Join UI Zera?"
          description="We're building the most engaged student automation community in Tamil Nadu. Here's what you get when you join."
        />

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((b, i) => {
            const Icon = b.icon;
            return (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.45, delay: i * 0.06 }}
                className={`bracket-card group relative flex flex-col border border-uipath-text/10 bg-white p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover dark:border-border dark:bg-card ${b.span}`}
              >
                <div
                  className={`mb-4 flex h-12 w-12 items-center justify-center ${b.iconBg} text-white shadow-sm transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 font-display text-base font-bold text-uipath-text dark:text-foreground">
                  {b.title}
                </h3>
                <p className="text-sm leading-relaxed text-uipath-mutedText dark:text-muted-foreground">
                  {b.description}
                </p>
                <span className="mt-4 font-mono text-[10px] font-bold uppercase tracking-widest text-uipath-text/30 dark:text-foreground/30">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-12 flex justify-center"
        >
          <Magnetic>
            <Button
              asChild
              size="lg"
              className="btn-primary rounded-none px-8 text-base font-bold shadow-lg"
            >
              <Link href="/login" className="flex items-center gap-2">
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </Magnetic>
        </motion.div>
      </div>
    </section>
  );
}
