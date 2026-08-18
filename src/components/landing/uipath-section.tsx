"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Briefcase,
  GraduationCap,
  Layers,
  Rocket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/shared/section-heading";
import { TiltCard } from "@/components/shared/tilt-card";
import { Magnetic } from "@/components/shared/magnetic";
import { Parallax } from "@/components/shared/parallax";
import dynamic from "next/dynamic";

// Remotion Player is ~800KB — lazy load it so it never blocks the initial page
const HeroRemotionPlayer = dynamic(
  () =>
    import("@/components/remotion/hero-player").then((m) => ({
      default: m.HeroRemotionPlayer,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="aspect-video w-full animate-pulse rounded-2xl bg-muted" />
    ),
  }
);

const features = [
  {
    icon: Bot,
    activity: "Sequence",
    title: "What is UiPath?",
    description:
      "UiPath is the world's leading enterprise automation platform. It enables anyone — from students to Fortune 500 enterprises — to build, manage, and deploy software robots that automate business processes.",
    headerColor: "bg-uipath-orange",
  },
  {
    icon: Layers,
    activity: "Invoke Workflow",
    title: "Studio & Orchestrator",
    description:
      "Design automations visually in UiPath Studio, then deploy and manage them at scale with Orchestrator — the command center for your digital workforce.",
    headerColor: "bg-uipath-blue",
  },
  {
    icon: Rocket,
    activity: "AI Agent",
    title: "Agentic AI",
    description:
      "UiPath's latest frontier — Agentic AI — combines LLMs with automation to create intelligent agents that reason, plan, and execute complex tasks autonomously.",
    headerColor: "bg-uipath-text dark:bg-foreground dark:text-background",
  },
];

const careers = [
  { role: "RPA Developer", salary: "₹6–15 LPA", icon: Bot },
  { role: "Automation Architect", salary: "₹15–30 LPA", icon: Layers },
  { role: "Process Consultant", salary: "₹10–25 LPA", icon: Briefcase },
  { role: "AI/ML Engineer + RPA", salary: "₹12–35 LPA", icon: GraduationCap },
];

/** Vertical connector between stacked activity nodes (mobile). */
function VerticalWire() {
  return (
    <svg width="10" height="32" className="mx-auto text-uipath-blue/60 lg:hidden">
      <line x1="5" y1="0" x2="5" y2="32" stroke="currentColor" strokeWidth="1.5" className="wire-dash" />
      <polygon points="1,26 9,26 5,32" fill="currentColor" />
    </svg>
  );
}

export function UiPathSection() {
  return (
    <section className="relative overflow-hidden border-t border-uipath-text/10 bg-white py-24 dark:border-border dark:bg-card">
      <Parallax speed={60} className="pointer-events-none absolute left-[3%] top-[8%]">
        <div className="h-10 w-10 border-2 border-uipath-blue/25" />
      </Parallax>
      <Parallax speed={-45} className="pointer-events-none absolute right-[5%] top-[30%]">
        <div className="h-6 w-6 bg-uipath-orange/25" />
      </Parallax>

      <div className="container relative mx-auto max-w-6xl">
        <SectionHeading
          badge="UiPath Platform"
          title="The World's #1 Automation Platform"
          description="Learn the platform powering over 10,000 enterprises worldwide — and unlock career opportunities that most students don't even know exist."
        />

        {/* Activity pipeline — cards styled as Studio activity nodes, wired together */}
        <div className="mt-14 flex flex-col items-stretch lg:flex-row lg:items-stretch">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="flex flex-1 flex-col lg:flex-row lg:items-center">
                {i > 0 && (
                  <>
                    <VerticalWire />
                    <svg
                      width="40"
                      height="10"
                      className="hidden shrink-0 self-center text-uipath-blue/60 lg:block"
                    >
                      <line x1="0" y1="5" x2="32" y2="5" stroke="currentColor" strokeWidth="1.5" className="wire-dash" />
                      <polygon points="32,1 40,5 32,9" fill="currentColor" />
                    </svg>
                  </>
                )}
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.5, delay: i * 0.12 }}
                  className="flex-1 border border-uipath-text/15 bg-white shadow-card transition-shadow duration-300 hover:shadow-card-hover dark:border-border dark:bg-background"
                >
                  {/* Activity title bar */}
                  <div
                    className={`flex items-center gap-2 ${f.headerColor} px-4 py-2.5 text-white`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="font-mono text-xs font-bold uppercase tracking-wider">
                      {f.activity}
                    </span>
                    <span className="ml-auto flex gap-1.5">
                      <span className="h-1.5 w-1.5 bg-white/50" />
                      <span className="h-1.5 w-1.5 bg-white/50" />
                      <span className="h-1.5 w-1.5 bg-white/50" />
                    </span>
                  </div>
                  <div className="p-5">
                    <h3 className="mb-2 font-display text-lg font-bold text-uipath-text dark:text-foreground">
                      {f.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-uipath-mutedText dark:text-muted-foreground">
                      {f.description}
                    </p>
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>

        {/* Remotion showcase */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          className="mx-auto mt-16 max-w-3xl"
        >
          <HeroRemotionPlayer />
        </motion.div>

        {/* Career cards */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-20"
        >
          <h3 className="mb-8 text-center font-display text-2xl font-extrabold text-uipath-text dark:text-foreground">
            Careers in <span className="bg-uipath-orange px-2 py-0.5 text-white">Automation</span>
          </h3>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {careers.map((c, i) => {
              const Icon = c.icon;
              return (
                <motion.div
                  key={c.role}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                >
                  <TiltCard className="group h-full">
                    <div className="bracket-card flex h-full flex-col items-center border border-uipath-text/10 bg-uipath-bg p-6 text-center shadow-card dark:border-border dark:bg-background">
                      <div className="mb-4 flex h-12 w-12 items-center justify-center bg-uipath-orange text-white shadow-sm transition-transform duration-300 group-hover:-translate-y-1">
                        <Icon className="h-6 w-6" />
                      </div>
                      <h4 className="font-display text-sm font-bold text-uipath-text dark:text-foreground">
                        {c.role}
                      </h4>
                      <p className="mt-2 font-mono text-xs font-bold text-uipath-blue">
                        {c.salary}
                      </p>
                    </div>
                  </TiltCard>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        <div className="mt-14 flex justify-center">
          <Magnetic>
            <Button
              asChild
              size="lg"
              className="btn-secondary-uipath rounded-none px-8 font-bold"
            >
              <Link href="/resources" className="flex items-center gap-2">
                Explore Learning Resources
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </Magnetic>
        </div>
      </div>
    </section>
  );
}
