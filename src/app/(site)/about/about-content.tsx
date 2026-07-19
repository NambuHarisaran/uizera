"use client";

import { motion } from "framer-motion";
import {
  Bot,
  GraduationCap,
  Heart,
  Lightbulb,
  Rocket,
  Target,
  Users,
} from "lucide-react";
import { SectionHeading } from "@/components/shared/section-heading";
import { SITE } from "@/lib/constants";

const pillars = [
  {
    icon: GraduationCap,
    title: "Learn",
    description:
      "Structured learning paths, curated resources, and hands-on projects to take you from zero to automation expert.",
    color: "bg-uipath-orange",
  },
  {
    icon: Target,
    title: "Practice",
    description:
      "Weekly challenges, timed quizzes, and a 30-day certification sprint to sharpen your skills under real pressure.",
    color: "bg-uipath-gold",
  },
  {
    icon: Rocket,
    title: "Grow",
    description:
      "Build a portfolio, earn certifications, and join a network of students and professionals shaping the future.",
    color: "bg-uipath-success",
  },
  {
    icon: Heart,
    title: "Give Back",
    description:
      "Mentor juniors, contribute to the community, and help build Tamil Nadu's automation ecosystem.",
    color: "bg-uipath-blue",
  },
];

const timeline = [
  {
    year: "2023",
    title: "The Spark",
    description: "A group of CSBS students discovered UiPath and saw its potential to transform careers at PSNA CET.",
  },
  {
    year: "2024",
    title: "Club Formation",
    description:
      "UiZera Club was officially formed under the Department of Computer Science & Business Systems with faculty mentorship.",
  },
  {
    year: "2025",
    title: "Community Growth",
    description:
      "100+ active members, 25+ events hosted, partnerships with UiPath, and the launch of the 30-day certification program.",
  },
  {
    year: "2026",
    title: "Digital Platform",
    description:
      "Launch of the UiZera platform — quizzes, leaderboards, challenges, and a complete digital ecosystem for automation learning.",
  },
];

export function AboutContent() {
  return (
    <div className="pb-24">
      {/* Hero */}
      <section className="hero-glow relative overflow-hidden py-24">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-20" />
        <div className="container relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl text-center"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-sm font-medium text-brand-600 dark:text-brand-400">
              <Bot className="h-4 w-4" />
              About Us
            </div>
            <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl">
              Empowering Students Through{" "}
              <span className="text-gradient">Intelligent Automation</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              {SITE.name} is the UiPath first Tamil community, born at {SITE.college}. 
              We believe every student deserves access to the skills that will define the 
              next decade of work.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-24">
        <div className="container">
          <div className="mx-auto grid max-w-5xl gap-12 md:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="rounded-2xl border bg-card p-8"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500">
                <Lightbulb className="h-6 w-6" />
              </div>
              <h2 className="mb-3 font-display text-2xl font-bold">Our Mission</h2>
              <p className="leading-relaxed text-muted-foreground">
                To create a self-sustaining community of student automation enthusiasts 
                who learn, practice, and grow together — making RPA and AI skills accessible 
                to every student in Tamil Nadu, regardless of their background.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="rounded-2xl border bg-card p-8"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                <Users className="h-6 w-6" />
              </div>
              <h2 className="mb-3 font-display text-2xl font-bold">Our Vision</h2>
              <p className="leading-relaxed text-muted-foreground">
                To be the leading student automation community in India — where members 
                graduate not just with degrees, but with industry-ready automation skills, 
                certifications, and a portfolio that opens doors to the best careers.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="border-t bg-card/30 py-24">
        <div className="container">
          <SectionHeading
            badge="Our Approach"
            title="Four Pillars of Growth"
            description="Everything we do falls into one of these four pillars."
          />
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {pillars.map((p, i) => {
              const Icon = p.icon;
              return (
                <motion.div
                  key={p.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="rounded-2xl border bg-background p-6 text-center"
                >
                  <div
                    className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${p.color} text-white shadow-lg`}
                  >
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="mb-2 font-display text-lg font-semibold">{p.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {p.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-24">
        <div className="container max-w-3xl">
          <SectionHeading
            badge="Our Journey"
            title="How We Got Here"
            description="From a spark of curiosity to a thriving community."
          />
          <div className="mt-14 space-y-0">
            {timeline.map((item, i) => (
              <motion.div
                key={item.year}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative flex gap-6 pb-10 last:pb-0"
              >
                {/* Line */}
                <div className="flex flex-col items-center">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-brand-500 bg-brand-500/10 font-display text-xs font-bold text-brand-500">
                    {item.year.slice(2)}
                  </div>
                  {i < timeline.length - 1 && (
                    <div className="w-px flex-1 bg-border" />
                  )}
                </div>
                <div className="pb-2 pt-1.5">
                  <h3 className="font-display text-base font-semibold">
                    {item.year} — {item.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
