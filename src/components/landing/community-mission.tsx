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
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/shared/section-heading";
import { Magnetic } from "@/components/shared/magnetic";
import { Parallax } from "@/components/shared/parallax";

const benefits = [
  {
    icon: Zap,
    title: "Interactive Quizzes",
    chip: "⚡ Real-Time Timer & Anti-Cheat",
    description:
      "Test your RPA fundamentals with timed competitive quizzes. Randomized questions, instant score calculation, and gold coins awarded on completion.",
    iconBg: "bg-uipath-orange text-white shadow-orange-500/30",
    glowBorder: "hover:border-uipath-orange/50 hover:shadow-[0_0_25px_-5px_rgba(250,70,22,0.25)]",
    span: "sm:col-span-2",
  },
  {
    icon: Target,
    title: "Weekly Challenges",
    chip: "🎯 Hands-on Automation",
    description:
      "Solve real-world workflow automation tasks. Get direct feedback and code reviews from experienced chapter coordinators.",
    iconBg: "bg-uipath-blue text-white shadow-blue-500/30",
    glowBorder: "hover:border-uipath-blue/50 hover:shadow-[0_0_25px_-5px_rgba(0,103,223,0.25)]",
    span: "",
  },
  {
    icon: Award,
    title: "30-Day Certification Sprint",
    chip: "🏆 Daily Guided Milestones",
    description:
      "Structured 30-day sprint preparing you for official UiPath Associate & Professional certifications with daily checkpoints.",
    iconBg: "bg-uipath-gold text-slate-950 shadow-amber-500/30",
    glowBorder: "hover:border-uipath-gold/50 hover:shadow-[0_0_25px_-5px_rgba(255,180,14,0.25)]",
    span: "",
  },
  {
    icon: Trophy,
    title: "Leaderboard & Badges",
    chip: "🎖️ Rank Up & Showcase",
    description:
      "Climb the live college leaderboard, earn prestigious achievement badges, and prove your automation prowess to peers.",
    iconBg: "bg-uipath-orange text-white shadow-orange-500/30",
    glowBorder: "hover:border-uipath-orange/50 hover:shadow-[0_0_25px_-5px_rgba(250,70,22,0.25)]",
    span: "",
  },
  {
    icon: Coins,
    title: "Earn Gold Coins",
    chip: "🪙 Verifiable Proof-of-Work",
    description:
      "Every quiz conquered, challenge completed, and sprint finished earns you gold coins — making your skill progression visible.",
    iconBg: "bg-uipath-gold text-slate-950 shadow-amber-500/30",
    glowBorder: "hover:border-uipath-gold/50 hover:shadow-[0_0_25px_-5px_rgba(255,180,14,0.25)]",
    span: "",
  },
  {
    icon: BookOpen,
    title: "Curated Resources",
    chip: "📚 Video Guides & Docs",
    description:
      "Free access to community cheat sheets, UiPath Academy roadmaps, official documentation, and student starter kits.",
    iconBg: "bg-uipath-blue text-white shadow-blue-500/30",
    glowBorder: "hover:border-uipath-blue/50 hover:shadow-[0_0_25px_-5px_rgba(0,103,223,0.25)]",
    span: "",
  },
  {
    icon: MessageCircle,
    title: "Community Support",
    chip: "🤝 Peer Mentorship & Chapter",
    description:
      "Collaborate with like-minded students across CSE, IT, CSBS, AI&DS, and Mech. Get 1-on-1 guidance from coordinators. No student automates alone.",
    iconBg: "bg-uipath-success text-slate-950 shadow-emerald-500/30",
    glowBorder: "hover:border-uipath-success/50 hover:shadow-[0_0_25px_-5px_rgba(52,222,105,0.25)]",
    span: "sm:col-span-2 lg:col-span-1",
  },
];

export function CommunityMission() {
  return (
    <section className="relative overflow-hidden bg-uipath-bg py-24 sm:py-28 dark:bg-background">
      <div className="bg-blueprint pointer-events-none absolute inset-0 opacity-50" />

      <Parallax speed={55} className="pointer-events-none absolute right-[4%] top-[12%]">
        <div className="h-12 w-12 rotate-45 border-2 border-uipath-orange/30 shadow-sm" />
      </Parallax>
      <Parallax speed={-40} className="pointer-events-none absolute left-[6%] bottom-[15%]">
        <div className="h-7 w-7 bg-uipath-gold/30 shadow-sm" />
      </Parallax>

      <div className="container relative mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          badge="Community Benefits"
          title="Why Join UiZera Club?"
          description="We're building the premier student automation chapter in Tamil Nadu. Here is everything you unlock as an active member."
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
                className={`bracket-card group relative flex flex-col justify-between overflow-hidden border border-uipath-text/15 bg-white/95 backdrop-blur-md p-6 sm:p-7 shadow-card transition-all duration-300 hover:-translate-y-1 dark:border-border dark:bg-card/95 ${b.glowBorder} ${b.span}`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl ${b.iconBg} shadow-md transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="font-mono text-xs font-bold text-muted-foreground/60">
                      #{String(i + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <span className="mb-2 inline-block rounded-md bg-black/[0.04] dark:bg-white/[0.06] px-2 py-0.5 font-mono text-[10px] font-bold text-foreground">
                    {b.chip}
                  </span>

                  <h3 className="mb-2 font-display text-lg sm:text-xl font-bold text-uipath-text transition-colors group-hover:text-uipath-orange dark:text-foreground">
                    {b.title}
                  </h3>

                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {b.description}
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-uipath-text/10 pt-3 dark:border-border font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <span>UiZera Ecosystem</span>
                  <span className="flex items-center gap-1 text-uipath-orange opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    Active Module <Sparkles className="h-2.5 w-2.5" />
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-14 flex justify-center"
        >
          <Magnetic>
            <Button
              asChild
              size="lg"
              className="relative group rounded-none bg-uipath-orange px-8 py-6 text-base font-bold text-white shadow-lg shadow-uipath-orange/25 transition-all duration-200 hover:bg-[#E53E12] hover:shadow-xl hover:shadow-uipath-orange/40 hover:-translate-y-0.5"
            >
              <Link href="/login" className="flex items-center gap-2.5">
                <span>Get Started Free</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </Button>
          </Magnetic>
        </motion.div>
      </div>
    </section>
  );
}

