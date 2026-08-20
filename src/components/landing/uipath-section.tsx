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
  Sparkles,
  Play,
  CheckCircle2,
  TrendingUp,
  Cpu,
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
    badge: "0.04s Execution",
    status: "Active Runtime",
    title: "What is UiPath?",
    description:
      "UiPath is the world's leading enterprise automation platform. It enables students and Fortune 500 companies alike to build, manage, and deploy software robots that automate complex business processes end-to-end.",
    headerColor: "bg-uipath-orange text-white",
    glowColor: "hover:border-uipath-orange/50 hover:shadow-[0_0_30px_-5px_rgba(250,70,22,0.25)]",
  },
  {
    icon: Layers,
    activity: "Invoke Workflow",
    badge: "Cloud Orchestrated",
    status: "Orchestrator v2026",
    title: "Studio & Orchestrator",
    description:
      "Design automations visually in UiPath Studio with drag-and-drop activities, then deploy and manage your robot army at scale with Orchestrator — the command center for enterprise automation.",
    headerColor: "bg-uipath-blue text-white",
    glowColor: "hover:border-uipath-blue/50 hover:shadow-[0_0_30px_-5px_rgba(0,103,223,0.25)]",
  },
  {
    icon: Rocket,
    activity: "Agentic AI Node",
    badge: "Autopilot LLM",
    status: "Autonomous Mode",
    title: "Agentic AI & Autopilot",
    description:
      "UiPath's cutting-edge frontier combines generative AI and specialized LLM agents with deterministic automations to reason, plan, and execute multi-step knowledge work completely autonomously.",
    headerColor: "bg-[#1B2430] text-white border-b border-white/10",
    glowColor: "hover:border-uipath-gold/50 hover:shadow-[0_0_30px_-5px_rgba(255,180,14,0.25)]",
  },
];

const careers = [
  {
    role: "RPA Developer",
    salary: "₹6–15 LPA",
    tag: "High Demand",
    icon: Bot,
    color: "bg-uipath-orange",
  },
  {
    role: "Automation Architect",
    salary: "₹15–30 LPA",
    tag: "Enterprise Leadership",
    icon: Layers,
    color: "bg-uipath-blue",
  },
  {
    role: "Process Consultant",
    salary: "₹10–25 LPA",
    tag: "Strategy & Operations",
    icon: Briefcase,
    color: "bg-uipath-gold",
  },
  {
    role: "AI/ML Engineer + RPA",
    salary: "₹12–35 LPA",
    tag: "Next-Gen Frontier",
    icon: GraduationCap,
    color: "bg-uipath-success",
  },
];

/** Vertical connector between stacked activity nodes (mobile). */
function VerticalWire() {
  return (
    <div className="flex flex-col items-center py-2 lg:hidden">
      <svg width="12" height="36" className="text-uipath-blue/70">
        <line x1="6" y1="0" x2="6" y2="36" stroke="currentColor" strokeWidth="2" className="wire-dash" />
        <polygon points="2,28 10,28 6,36" fill="currentColor" />
      </svg>
    </div>
  );
}

export function UiPathSection() {
  return (
    <section className="relative overflow-hidden border-t border-uipath-text/10 bg-white py-24 sm:py-28 dark:border-border dark:bg-card">
      <Parallax speed={60} className="pointer-events-none absolute left-[3%] top-[8%]">
        <div className="h-12 w-12 border-2 border-uipath-blue/25 shadow-sm" />
      </Parallax>
      <Parallax speed={-45} className="pointer-events-none absolute right-[5%] top-[30%]">
        <div className="h-8 w-8 bg-uipath-orange/25 shadow-sm" />
      </Parallax>

      <div className="container relative mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          badge="UiPath Platform Ecosystem"
          title="The World's #1 Automation Platform"
          description="Learn the enterprise standard powering over 10,000 global enterprises — and unlock top-tier engineering roles that high-growth companies are eager to fill."
        />

        {/* Activity pipeline — cards styled as Studio activity nodes, wired together */}
        <div className="mt-14 flex flex-col items-stretch lg:flex-row lg:items-stretch">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="flex flex-1 flex-col lg:flex-row lg:items-stretch">
                {i > 0 && (
                  <>
                    <VerticalWire />
                    <div className="hidden shrink-0 items-center justify-center self-center px-1 lg:flex">
                      <svg width="44" height="14" className="text-uipath-blue/70">
                        <line x1="0" y1="7" x2="34" y2="7" stroke="currentColor" strokeWidth="2" className="wire-dash" />
                        <polygon points="34,2 44,7 34,12" fill="currentColor" />
                      </svg>
                    </div>
                  </>
                )}
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.5, delay: i * 0.12 }}
                  className={`bracket-card group flex flex-1 flex-col overflow-hidden border border-uipath-text/15 bg-white shadow-card transition-all duration-300 dark:border-border dark:bg-background ${f.glowColor}`}
                >
                  {/* Activity title bar */}
                  <div
                    className={`flex items-center justify-between gap-2 ${f.headerColor} px-4 py-2.5`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span className="font-mono text-xs font-bold uppercase tracking-wider">
                        {f.activity}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-semibold opacity-90">
                        {f.badge}
                      </span>
                      <span className="flex gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-white/60" />
                        <span className="h-1.5 w-1.5 rounded-full bg-white/60" />
                        <span className="h-1.5 w-1.5 rounded-full bg-white/60" />
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="flex flex-1 flex-col justify-between p-6">
                    <div>
                      <div className="mb-3 inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-uipath-orange">
                        <CheckCircle2 className="h-3 w-3" />
                        {f.status}
                      </div>
                      <h3 className="mb-2 font-display text-xl font-bold text-uipath-text transition-colors group-hover:text-uipath-orange dark:text-foreground">
                        {f.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {f.description}
                      </p>
                    </div>

                    <div className="mt-5 border-t border-uipath-text/10 pt-3 dark:border-border">
                      <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-uipath-blue dark:text-blue-400">
                        Node {String(i + 1).padStart(2, "0")} · UiPath Studio
                      </span>
                    </div>
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
          className="mx-auto mt-20 max-w-4xl"
        >
          <div className="relative rounded-2xl border border-uipath-orange/30 bg-black/[0.02] p-2 sm:p-3 shadow-2xl shadow-uipath-orange/10 dark:border-uipath-orange/20 dark:bg-white/[0.02]">
            <HeroRemotionPlayer />
          </div>
        </motion.div>

        {/* Career cards */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-24"
        >
          <div className="text-center mb-10">
            <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-uipath-text dark:text-foreground">
              High-Paying Careers in{" "}
              <span className="bg-uipath-orange px-2.5 py-0.5 text-white shadow-sm">Automation</span>
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Average industry packages reported across top automation recruiting firms
            </p>
          </div>

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
                    <div className="bracket-card flex h-full flex-col justify-between border border-uipath-text/10 bg-uipath-bg p-6 text-center shadow-card transition-all duration-300 hover:border-uipath-orange/40 hover:shadow-lg dark:border-border dark:bg-background">
                      <div className="flex flex-col items-center">
                        <div
                          className={`mb-4 flex h-13 w-13 items-center justify-center rounded-xl ${c.color} p-3 text-white shadow-md transition-transform duration-300 group-hover:-translate-y-1 group-hover:rotate-6`}
                        >
                          <Icon className="h-6 w-6" />
                        </div>
                        <span className="mb-1 rounded-full bg-black/5 dark:bg-white/5 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                          {c.tag}
                        </span>
                        <h4 className="font-display text-base font-bold text-uipath-text transition-colors group-hover:text-uipath-orange dark:text-foreground">
                          {c.role}
                        </h4>
                      </div>

                      <div className="mt-4 border-t border-uipath-text/10 pt-3 dark:border-border">
                        <p className="font-mono text-sm font-extrabold text-uipath-blue dark:text-blue-400">
                          {c.salary}
                        </p>
                      </div>
                    </div>
                  </TiltCard>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        <div className="mt-16 flex justify-center">
          <Magnetic>
            <Button
              asChild
              size="lg"
              className="relative group rounded-none bg-uipath-blue px-8 py-6 font-bold text-white shadow-lg shadow-uipath-blue/25 transition-all duration-200 hover:bg-[#0053B5] hover:shadow-xl hover:shadow-uipath-blue/40 hover:-translate-y-0.5"
            >
              <Link href="/resources" className="flex items-center gap-2.5">
                <span>Explore Learning Resources</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </Button>
          </Magnetic>
        </div>
      </div>
    </section>
  );
}

