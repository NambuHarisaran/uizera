"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, Bot, Zap, Trophy } from "lucide-react";
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
        <div className="h-16 w-16 animate-pulse rounded-2xl bg-uipath-orange" />
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
  { icon: Bot, label: "UiPath Studio", color: "text-uipath-blue border-uipath-blue/30" },
  { icon: Zap, label: "Agentic AI", color: "text-uipath-orange border-uipath-orange/30" },
  { icon: Trophy, label: "30-Day Cert Sprint", color: "text-amber-600 border-uipath-gold/40" },
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
      className="relative min-h-[92dvh] overflow-hidden bg-uipath-bg pt-24 dark:bg-background"
    >
      {/* Blueprint grid backdrop */}
      <div className="bg-blueprint pointer-events-none absolute inset-0" />

      {/* Parallax decorative squares — flat UiPath brand motif */}
      <motion.div style={{ y: decoY }} className="pointer-events-none absolute inset-0">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className="absolute left-[6%] top-[18%] h-10 w-10 border-2 border-uipath-orange/40"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 55, repeat: Infinity, ease: "linear" }}
          className="absolute right-[10%] top-[12%] h-6 w-6 bg-uipath-gold/50"
        />
        <motion.div
          animate={{ y: [0, -14, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-[12%] bottom-[24%] h-4 w-4 bg-uipath-orange/60"
        />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 48, repeat: Infinity, ease: "linear" }}
          className="absolute right-[6%] bottom-[30%] h-12 w-12 border-2 border-uipath-blue/30"
        />
      </motion.div>

      <div className="container relative z-10 mx-auto max-w-6xl px-4">
        <div className="grid items-center gap-10 lg:grid-cols-12">
          {/* Left: copy */}
          <motion.div style={{ y: copyY }} className="lg:col-span-6">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col items-start text-left"
            >
              {/* Status chip — mono, square dot, Studio vibe */}
              <div className="mb-6 inline-flex items-center gap-2.5 border border-uipath-text/15 bg-white px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-widest text-uipath-text shadow-sm dark:border-border dark:bg-card dark:text-foreground">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping bg-uipath-orange opacity-60" />
                  <span className="relative inline-flex h-2.5 w-2.5 bg-uipath-orange" />
                </span>
                UiPath First Tamil Community · PSNA CET
              </div>

              <h1 className="font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-uipath-text dark:text-foreground sm:text-5xl md:text-6xl">
                Empowering the Next Generation of{" "}
                <span className="mt-3 inline-block bg-uipath-orange px-3 py-1 text-white">
                  <RotatingText words={ROTATING_WORDS} />
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-relaxed text-uipath-mutedText dark:text-muted-foreground sm:text-lg">
                {SITE.description} Learn RPA, compete in weekly quizzes, earn
                gold coins, and fast-track your enterprise career.
              </p>

              {/* Activity chips wired like Studio activities */}
              <div className="mt-7 flex flex-wrap items-center font-mono text-xs font-semibold">
                {ACTIVITY_CHIPS.map((chip, i) => {
                  const Icon = chip.icon;
                  return (
                    <div key={chip.label} className="flex items-center">
                      {i > 0 && (
                        <svg width="28" height="10" className="text-uipath-blue/50">
                          <line
                            x1="0"
                            y1="5"
                            x2="28"
                            y2="5"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            className="wire-dash"
                          />
                        </svg>
                      )}
                      <span
                        className={`flex items-center gap-1.5 border bg-white px-3 py-1.5 shadow-sm dark:bg-card ${chip.color}`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {chip.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-9 flex flex-wrap items-center gap-4">
                <Magnetic>
                  <Button
                    asChild
                    size="lg"
                    className="btn-primary rounded-none px-8 text-base font-bold shadow-lg"
                  >
                    <Link href="/login" className="flex items-center gap-2">
                      Join Community Free
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </Magnetic>
                <Magnetic strength={0.2}>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="rounded-none border-2 border-uipath-text/80 bg-transparent px-8 text-base font-bold text-uipath-text hover:bg-uipath-text hover:text-white dark:border-foreground/70 dark:text-foreground dark:hover:bg-foreground dark:hover:text-background"
                  >
                    <Link href="/leaderboard">View Leaderboard</Link>
                  </Button>
                </Magnetic>
              </div>

              <p className="mt-8 font-mono text-[11px] font-medium uppercase tracking-wider text-uipath-mutedText dark:text-muted-foreground">
                {SITE.college} · {SITE.department}
              </p>
            </motion.div>
          </motion.div>

          {/* Right: three.js automation scene */}
          <motion.div style={{ y: sceneY }} className="lg:col-span-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="relative h-[380px] w-full sm:h-[460px] lg:h-[540px]"
            >
              <AutomationScene />
              {/* HUD corners over the canvas */}
              <div className="pointer-events-none absolute left-2 top-2 h-5 w-5 border-l-2 border-t-2 border-uipath-orange/70" />
              <div className="pointer-events-none absolute right-2 top-2 h-5 w-5 border-r-2 border-t-2 border-uipath-orange/70" />
              <div className="pointer-events-none absolute bottom-2 left-2 h-5 w-5 border-b-2 border-l-2 border-uipath-orange/70" />
              <div className="pointer-events-none absolute bottom-2 right-2 h-5 w-5 border-b-2 border-r-2 border-uipath-orange/70" />
              <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-uipath-mutedText dark:text-muted-foreground">
                digital workforce · online
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* UiPath platform ticker */}
      <div className="relative z-10 mt-14 border-y border-uipath-text/10 bg-white py-4 dark:border-border dark:bg-card">
        <Marquee duration={34}>
          {TICKER.map((item) => (
            <span
              key={item}
              className="flex items-center font-display text-sm font-bold uppercase tracking-wider text-uipath-text/80 dark:text-foreground/80"
            >
              <span className="mx-6 h-2.5 w-2.5 shrink-0 bg-uipath-orange" />
              {item}
            </span>
          ))}
        </Marquee>
      </div>
    </section>
  );
}
