"use client";

import {
  Banknote,
  BrainCircuit,
  Clock,
  Repeat,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import { SectionHeading } from "@/components/shared/section-heading";
import { ScrollStack } from "@/components/shared/scroll-stack";
import { Parallax } from "@/components/shared/parallax";

const reasons = [
  {
    icon: Clock,
    title: "Save 70% of Time",
    description:
      "Automate repetitive rule-based tasks and free up valuable hours for creative, high-impact problem solving that drives real enterprise value.",
    color: "bg-uipath-orange text-white",
    borderGlow: "hover:border-uipath-orange/50 hover:shadow-[0_0_30px_-5px_rgba(250,70,22,0.2)]",
    badge: "Efficiency & Speed",
    stat: "70%",
    statLabel: "Time Reclaimed",
    statSubtext: "Across manual workflows",
  },
  {
    icon: Repeat,
    title: "Zero Human Errors",
    description:
      "Software robots execute with mathematical precision every single time — no typos, no missed calculations, and zero execution fatigue.",
    color: "bg-uipath-blue text-white",
    borderGlow: "hover:border-uipath-blue/50 hover:shadow-[0_0_30px_-5px_rgba(0,103,223,0.2)]",
    badge: "100% Accuracy",
    stat: "0",
    statLabel: "Errors Per Run",
    statSubtext: "Deterministic execution",
  },
  {
    icon: TrendingUp,
    title: "Massive Industry Growth",
    description:
      "The global RPA & Agentic AI automation ecosystem is projected to surge past $30B by 2030. Early student adopters will lead the next wave.",
    color: "bg-uipath-gold text-slate-950 font-bold",
    borderGlow: "hover:border-uipath-gold/50 hover:shadow-[0_0_30px_-5px_rgba(255,180,14,0.2)]",
    badge: "Market Demand",
    stat: "$30B+",
    statLabel: "Market by 2030",
    statSubtext: "Projected global scale",
  },
  {
    icon: Banknote,
    title: "High-Demand Careers",
    description:
      "Certified RPA developers command salaries 40% higher than average entry-level roles. Global enterprises compete fiercely for verified talent.",
    color: "bg-uipath-success text-slate-950 font-bold",
    borderGlow: "hover:border-uipath-success/50 hover:shadow-[0_0_30px_-5px_rgba(52,222,105,0.2)]",
    badge: "Career ROI",
    stat: "+40%",
    statLabel: "Above Avg Salary",
    statSubtext: "Entry & senior roles",
  },
  {
    icon: BrainCircuit,
    title: "AI + Agentic Automation",
    description:
      "Seamlessly blend UiPath workflows with generative AI and LLM agents for intelligent document understanding, reasoning, and autonomous execution.",
    color: "bg-uipath-blue text-white",
    borderGlow: "hover:border-uipath-blue/50 hover:shadow-[0_0_30px_-5px_rgba(0,103,223,0.2)]",
    badge: "Next-Gen AI",
    stat: "LLM",
    statLabel: "Powered Agents",
    statSubtext: "Autopilot integration",
  },
  {
    icon: ShieldCheck,
    title: "Enterprise-Ready Skills",
    description:
      "Gain hands-on mastery of the world's #1 automation platform trusted by over 10,000 global enterprises — from fast-growing startups to Fortune 500.",
    color: "bg-uipath-orange text-white",
    borderGlow: "hover:border-uipath-orange/50 hover:shadow-[0_0_30px_-5px_rgba(250,70,22,0.2)]",
    badge: "Global Standard",
    stat: "10K+",
    statLabel: "Global Enterprises",
    statSubtext: "Production deployments",
  },
];

export function WhyRpaSection() {
  return (
    <section className="relative overflow-hidden bg-uipath-bg py-24 sm:py-28 dark:bg-background">
      <div className="bg-blueprint pointer-events-none absolute inset-0 opacity-50" />

      {/* Parallax decorations */}
      <Parallax speed={70} className="pointer-events-none absolute right-[5%] top-[10%]">
        <div className="h-14 w-14 rotate-12 border-2 border-uipath-orange/30 shadow-sm" />
      </Parallax>
      <Parallax speed={-50} className="pointer-events-none absolute left-[4%] top-[40%]">
        <div className="h-8 w-8 bg-uipath-blue/20 shadow-sm" />
      </Parallax>

      <div className="container relative mx-auto max-w-4xl px-4 sm:px-6">
        <SectionHeading
          badge="Why RPA & UiPath?"
          title="Automation is the Future of Work"
          description="Robotic Process Automation and Agentic AI are reshaping engineering careers at breakneck speed. Scroll the stack to explore the transformation."
        />

        <ScrollStack topOffset={100} gap={24} className="mt-8 pb-10">
          {reasons.map((r, i) => {
            const Icon = r.icon;
            return (
              <div
                key={r.title}
                className={`bracket-card group overflow-hidden border border-uipath-text/15 bg-white/95 backdrop-blur-md shadow-card transition-all duration-300 dark:border-border dark:bg-card/95 ${r.borderGlow}`}
              >
                {/* Header bar matching UiPath Studio activity node style */}
                <div className="flex items-center justify-between border-b border-uipath-text/10 bg-black/[0.02] px-6 py-2.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground dark:border-border dark:bg-white/[0.02]">
                  <span className="flex items-center gap-2 font-bold text-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-uipath-orange" />
                    Step {String(i + 1).padStart(2, "0")} of {String(reasons.length).padStart(2, "0")}
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold text-uipath-orange">
                    <Sparkles className="h-3 w-3" />
                    {r.badge}
                  </span>
                </div>

                <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:gap-8 sm:p-9">
                  {/* Icon container */}
                  <div className="flex shrink-0 items-center gap-4 sm:flex-col sm:items-start">
                    <div
                      className={`flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-xl ${r.color} shadow-md transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3`}
                    >
                      <Icon className="h-7 w-7 sm:h-8 sm:w-8" />
                    </div>
                  </div>

                  {/* Copy content */}
                  <div className="flex-1">
                    <h3 className="font-display text-xl sm:text-2xl lg:text-3xl font-extrabold text-uipath-text transition-colors group-hover:text-uipath-orange dark:text-foreground">
                      {r.title}
                    </h3>
                    <p className="mt-2.5 max-w-lg text-sm sm:text-base leading-relaxed text-muted-foreground">
                      {r.description}
                    </p>
                  </div>

                  {/* High-contrast Stat Callout */}
                  <div className="shrink-0 border-t border-uipath-text/10 pt-4 dark:border-border sm:border-l sm:border-t-0 sm:pl-8 sm:pt-0">
                    <div className="flex items-baseline gap-1 font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-uipath-orange">
                      {r.stat}
                    </div>
                    <div className="mt-1 font-mono text-xs font-bold uppercase tracking-wider text-foreground">
                      {r.statLabel}
                    </div>
                    <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                      {r.statSubtext}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </ScrollStack>
      </div>
    </section>
  );
}

