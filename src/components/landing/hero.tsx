"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, Bot, Zap, Trophy, Sparkles, Activity, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RotatingText } from "@/components/shared/rotating-text";
import { Magnetic } from "@/components/shared/magnetic";
import { Marquee } from "@/components/shared/marquee";
import { SITE } from "@/lib/constants";

const AutomationScene = dynamic(
  () => import("@/components/landing/three/automation-scene"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center">
        <div className="relative flex items-center justify-center">
          <div className="h-16 w-16 animate-ping rounded-2xl bg-uipath-orange/20" />
          <div className="absolute h-12 w-12 animate-pulse rounded-2xl bg-uipath-orange shadow-lg shadow-uipath-orange/30" />
        </div>
      </div>
    ),
  }
);

const ROTATING_WORDS = [
  "Automation Leaders",
  "RPA Developers",
  "Agent Builders",
  "Problem Solvers",
] as const;

const TICKER = [
  "UiPath Studio",
  "Orchestrator",
  "Agentic AI",
  "Document Understanding",
  "AI Center",
  "UiPath Assistant",
  "Task Mining",
  "Autopilot",
  "UiPath Apps",
  "Insights",
] as const;

const ACTIVITY_CHIPS = [
  {
    icon: Bot,
    label: "UiPath Studio",
    tag: "Visual RPA",
    color: "text-uipath-blue border-uipath-blue/30 bg-blue-50/50 dark:bg-blue-950/20 hover:border-uipath-blue/60 hover:shadow-[0_0_15px_-3px_rgba(0,103,223,0.3)]",
    dot: "bg-uipath-blue",
  },
  {
    icon: Zap,
    label: "Agentic AI",
    tag: "LLM + Workflows",
    color: "text-uipath-orange border-uipath-orange/30 bg-orange-50/50 dark:bg-orange-950/20 hover:border-uipath-orange/60 hover:shadow-[0_0_15px_-3px_rgba(250,70,22,0.3)]",
    dot: "bg-uipath-orange",
  },
  {
    icon: Trophy,
    label: "30-Day Cert Sprint",
    tag: "Daily Milestones",
    color: "text-amber-600 dark:text-amber-400 border-uipath-gold/40 bg-amber-50/50 dark:bg-amber-950/20 hover:border-uipath-gold hover:shadow-[0_0_15px_-3px_rgba(255,180,14,0.3)]",
    dot: "bg-uipath-gold",
  },
] as const;

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  // Scroll parallax: copy drifts up slower, scene faster, deco squares fastest
  const copyY = useTransform(scrollYProgress, [0, 1], [0, 60]);
  const sceneY = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const decoY = useTransform(scrollYProgress, [0, 1], [0, -160]);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[92dvh] overflow-hidden bg-uipath-bg pt-20 sm:pt-24 dark:bg-background"
    >
      {/* Blueprint grid & subtle ambient radial glow */}
      <div className="bg-blueprint pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute -left-40 top-1/4 h-96 w-96 rounded-full bg-uipath-orange/10 blur-3xl dark:bg-uipath-orange/5" />
      <div className="pointer-events-none absolute -right-40 top-1/3 h-96 w-96 rounded-full bg-uipath-blue/10 blur-3xl dark:bg-uipath-blue/5" />

      {/* Parallax decorative squares — flat UiPath brand motif */}
      <motion.div style={{ y: decoY }} className="pointer-events-none absolute inset-0">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className="absolute left-[6%] top-[18%] h-10 w-10 border-2 border-uipath-orange/40 shadow-sm"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 55, repeat: Infinity, ease: "linear" }}
          className="absolute right-[10%] top-[12%] h-6 w-6 bg-uipath-gold/50 shadow-sm"
        />
        <motion.div
          animate={{ y: [0, -14, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-[12%] bottom-[24%] h-4 w-4 bg-uipath-orange/60 shadow-sm"
        />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 48, repeat: Infinity, ease: "linear" }}
          className="absolute right-[6%] bottom-[30%] h-12 w-12 border-2 border-uipath-blue/30 shadow-sm"
        />
      </motion.div>

      <div className="container relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-8">
          {/* Left: copy */}
          <motion.div style={{ y: copyY }} className="lg:col-span-6">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col items-start text-left"
            >
              {/* Status badge with dynamic pulse */}
              <div className="group mb-6 inline-flex items-center gap-2.5 rounded-full border border-uipath-orange/30 bg-white/90 px-4 py-1.5 font-mono text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-uipath-text shadow-sm backdrop-blur-md transition-all hover:border-uipath-orange/60 hover:shadow-md hover:shadow-uipath-orange/10 dark:border-uipath-orange/30 dark:bg-card/80 dark:text-foreground">
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-uipath-orange opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-uipath-orange" />
                </span>
                <span className="font-bold text-uipath-orange">UiPath Community Chapter</span>
                <span className="hidden sm:inline text-muted-foreground/60">•</span>
                <span className="font-mono text-muted-foreground">PSNA CET</span>
              </div>

              {/* Dynamic Display Title */}
              <h1 className="font-display text-3xl font-extrabold leading-[1.12] tracking-tight text-uipath-text dark:text-foreground sm:text-5xl md:text-6xl">
                Empowering the Next Generation of{" "}
                <span className="relative mt-2 sm:mt-3 inline-block rounded-none bg-uipath-orange px-3 py-1 text-white shadow-md shadow-uipath-orange/30">
                  <RotatingText words={ROTATING_WORDS} />
                </span>
              </h1>

              {/* Subheadline with strong typography contrast */}
              <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground dark:text-slate-300 sm:text-lg">
                {SITE.description} Master RPA workflows, compete in real-time weekly quizzes, earn
                gold coin bounties, and fast-track your enterprise engineering career.
              </p>

              {/* Activity chips wired like Studio activities */}
              <div className="mt-7 flex flex-wrap items-center gap-2.5 font-mono text-xs font-semibold">
                {ACTIVITY_CHIPS.map((chip) => {
                  const Icon = chip.icon;
                  return (
                    <div
                      key={chip.label}
                      className={`group flex items-center gap-2 border px-3 py-1.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 ${chip.color}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${chip.dot}`} />
                      <Icon className="h-3.5 w-3.5" />
                      <span className="font-bold">{chip.label}</span>
                      <span className="hidden sm:inline text-[10px] opacity-70 font-normal">
                        ({chip.tag})
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Enhanced Action Buttons with glow and micro-elevation */}
              <div className="mt-9 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 w-full sm:w-auto">
                <Magnetic>
                  <Button
                    asChild
                    size="lg"
                    className="relative group rounded-none bg-uipath-orange px-7 sm:px-8 py-6 text-base font-bold text-white shadow-lg shadow-uipath-orange/25 transition-all duration-200 hover:bg-[#E53E12] hover:shadow-xl hover:shadow-uipath-orange/40 hover:-translate-y-0.5 w-full sm:w-auto justify-center"
                  >
                    <Link href="/login" className="flex items-center justify-center gap-2.5">
                      <span>Join Community Free</span>
                      <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </Link>
                  </Button>
                </Magnetic>

                <Magnetic strength={0.2}>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="rounded-none border-2 border-uipath-text/80 bg-white/60 dark:bg-card/60 backdrop-blur-sm px-6 sm:px-8 py-6 text-base font-bold text-uipath-text transition-all duration-200 hover:bg-uipath-text hover:text-white hover:-translate-y-0.5 dark:border-foreground/70 dark:text-foreground dark:hover:bg-foreground dark:hover:text-background w-full sm:w-auto justify-center shadow-sm"
                  >
                    <Link href="/leaderboard" className="flex items-center justify-center gap-2">
                      <Trophy className="h-4 w-4 text-uipath-gold" />
                      <span>View Leaderboard</span>
                    </Link>
                  </Button>
                </Magnetic>
              </div>

              {/* College & Department footnote badge */}
              <div className="mt-8 flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-uipath-blue" />
                <span>{SITE.college}</span>
                <span>·</span>
                <span>{SITE.department}</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right: three.js automation scene */}
          <motion.div style={{ y: sceneY }} className="lg:col-span-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="relative h-[380px] w-full sm:h-[460px] lg:h-[540px] rounded-xl border border-uipath-text/10 bg-white/40 shadow-card backdrop-blur-sm dark:border-border/60 dark:bg-card/40"
            >
              <AutomationScene />

              {/* HUD corners over the canvas */}
              <div className="pointer-events-none absolute left-3 top-3 h-5 w-5 border-l-2 border-t-2 border-uipath-orange" />
              <div className="pointer-events-none absolute right-3 top-3 h-5 w-5 border-r-2 border-t-2 border-uipath-orange" />
              <div className="pointer-events-none absolute bottom-3 left-3 h-5 w-5 border-b-2 border-l-2 border-uipath-orange" />
              <div className="pointer-events-none absolute bottom-3 right-3 h-5 w-5 border-b-2 border-r-2 border-uipath-orange" />

              {/* Telemetry status bar */}
              <div className="pointer-events-none absolute top-4 left-4 right-4 flex items-center justify-between font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
                <span className="flex items-center gap-1.5 rounded bg-background/80 px-2 py-0.5 shadow-sm">
                  <Activity className="h-3 w-3 text-uipath-success animate-pulse" />
                  Bot Workforce · Live
                </span>
                <span className="hidden sm:inline-block rounded bg-background/80 px-2 py-0.5 shadow-sm">
                  Latency: 12ms · 99.9% Uptime
                </span>
              </div>

              <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-uipath-text/10 bg-background/90 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-uipath-text shadow-sm backdrop-blur-md dark:border-border dark:text-foreground">
                UiPath Studio Engine · Active
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* UiPath platform ticker */}
      <div className="relative z-10 mt-14 border-y border-uipath-text/10 bg-white py-4 shadow-sm dark:border-border dark:bg-card">
        <Marquee duration={32}>
          {TICKER.map((item) => (
            <span
              key={item}
              className="flex items-center font-display text-sm font-bold uppercase tracking-wider text-uipath-text/90 transition-colors hover:text-uipath-orange dark:text-foreground/90"
            >
              <span className="mx-6 h-2 w-2 shrink-0 rounded-none bg-uipath-orange shadow-sm shadow-uipath-orange/50" />
              {item}
            </span>
          ))}
        </Marquee>
      </div>
    </section>
  );
}

