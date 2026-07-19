"use client";

import {
  Banknote,
  BrainCircuit,
  Clock,
  Repeat,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { SectionHeading } from "@/components/shared/section-heading";
import { ScrollStack } from "@/components/shared/scroll-stack";
import { Parallax } from "@/components/shared/parallax";

const reasons = [
  {
    icon: Clock,
    title: "Save 70% of Time",
    description:
      "Automate repetitive tasks and free up hours for creative, strategic work that drives real impact.",
    color: "bg-uipath-orange",
    stat: "70%",
    statLabel: "time reclaimed",
  },
  {
    icon: Repeat,
    title: "Zero Human Errors",
    description:
      "Software robots execute perfectly every time — no typos, no missed steps, no fatigue.",
    color: "bg-uipath-blue",
    stat: "0",
    statLabel: "errors per run",
  },
  {
    icon: TrendingUp,
    title: "Massive Industry Growth",
    description:
      "The RPA market is projected to reach $30B+ by 2030. Early adopters will lead the next wave.",
    color: "bg-uipath-gold",
    stat: "$30B",
    statLabel: "market by 2030",
  },
  {
    icon: Banknote,
    title: "High-Demand Careers",
    description:
      "RPA developers earn 40% above average. Companies worldwide are desperate for automation talent.",
    color: "bg-uipath-success",
    stat: "+40%",
    statLabel: "above avg salary",
  },
  {
    icon: BrainCircuit,
    title: "AI + Automation",
    description:
      "Combine UiPath with AI models for intelligent document processing, decision-making, and agentic workflows.",
    color: "bg-uipath-blue",
    stat: "LLM",
    statLabel: "powered agents",
  },
  {
    icon: ShieldCheck,
    title: "Enterprise-Ready Skills",
    description:
      "Learn the platform trusted by 10,000+ enterprises worldwide — from startups to Fortune 500.",
    color: "bg-uipath-orange",
    stat: "10K+",
    statLabel: "enterprises",
  },
];

export function WhyRpaSection() {
  return (
    <section className="relative overflow-hidden bg-uipath-bg py-24 dark:bg-background">
      <div className="bg-blueprint pointer-events-none absolute inset-0" />

      {/* Parallax decorations */}
      <Parallax speed={70} className="pointer-events-none absolute right-[5%] top-[10%]">
        <div className="h-14 w-14 rotate-12 border-2 border-uipath-orange/30" />
      </Parallax>
      <Parallax speed={-50} className="pointer-events-none absolute left-[4%] top-[40%]">
        <div className="h-8 w-8 bg-uipath-blue/20" />
      </Parallax>

      <div className="container relative mx-auto max-w-4xl">
        <SectionHeading
          badge="Why RPA?"
          title="Automation is the Future of Work"
          description="Robotic Process Automation is reshaping industries at an unprecedented pace. Scroll the stack."
        />

        <ScrollStack topOffset={100} gap={22} className="mt-6 pb-8">
          {reasons.map((r, i) => {
            const Icon = r.icon;
            return (
              <div
                key={r.title}
                className="bracket-card overflow-hidden border border-uipath-text/10 bg-white shadow-card dark:border-border dark:bg-card"
              >
                <div className="flex flex-col gap-6 p-8 sm:flex-row sm:items-center sm:gap-10 sm:p-10">
                  {/* Index + icon */}
                  <div className="flex shrink-0 items-center gap-5 sm:flex-col sm:items-start">
                    <span className="font-mono text-sm font-bold text-uipath-mutedText dark:text-muted-foreground">
                      {String(i + 1).padStart(2, "0")} / {String(reasons.length).padStart(2, "0")}
                    </span>
                    <div
                      className={`flex h-16 w-16 items-center justify-center ${r.color} text-white shadow-md`}
                    >
                      <Icon className="h-8 w-8" />
                    </div>
                  </div>

                  {/* Copy */}
                  <div className="flex-1">
                    <h3 className="font-display text-2xl font-extrabold text-uipath-text dark:text-foreground sm:text-3xl">
                      {r.title}
                    </h3>
                    <p className="mt-3 max-w-lg text-sm leading-relaxed text-uipath-mutedText dark:text-muted-foreground sm:text-base">
                      {r.description}
                    </p>
                  </div>

                  {/* Big flat stat */}
                  <div className="shrink-0 border-t border-uipath-text/10 pt-4 dark:border-border sm:border-l sm:border-t-0 sm:pl-8 sm:pt-0">
                    <div className="font-display text-4xl font-extrabold text-uipath-orange sm:text-5xl">
                      {r.stat}
                    </div>
                    <div className="mt-1 font-mono text-[11px] font-semibold uppercase tracking-widest text-uipath-mutedText dark:text-muted-foreground">
                      {r.statLabel}
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
