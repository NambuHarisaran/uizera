"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Award, Calendar, Sparkles, Users, TrendingUp, ShieldCheck } from "lucide-react";
import { SITE } from "@/lib/constants";

const stats = [
  {
    label: "Community Members",
    value: SITE.stats.members,
    suffix: "+",
    icon: Users,
    tag: "Active Learners",
    color: "from-orange-500/20 to-orange-500/0",
    iconBg: "bg-uipath-orange/15 text-uipath-orange border-uipath-orange/30",
  },
  {
    label: "Events Hosted",
    value: SITE.stats.events,
    suffix: "+",
    icon: Calendar,
    tag: "Workshops & Sprints",
    color: "from-blue-500/20 to-blue-500/0",
    iconBg: "bg-uipath-blue/15 text-uipath-blue border-uipath-blue/30",
  },
  {
    label: "Years Active",
    value: SITE.stats.years,
    suffix: "+",
    icon: Sparkles,
    tag: "Chapter Legacy",
    color: "from-amber-500/20 to-amber-500/0",
    iconBg: "bg-uipath-gold/15 text-amber-600 dark:text-amber-400 border-uipath-gold/30",
  },
  {
    label: "Certifications",
    value: SITE.stats.certifications,
    suffix: "",
    icon: Award,
    tag: "Official UiPath",
    color: "from-emerald-500/20 to-emerald-500/0",
    iconBg: "bg-uipath-success/15 text-emerald-600 dark:text-emerald-400 border-uipath-success/30",
  },
];

function AnimatedCounter({ value, suffix }: { value: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (!inView) return;
    let frame: number;
    const duration = 1600;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * value));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, value]);

  return (
    <span
      ref={ref}
      className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tabular-nums tracking-tight text-uipath-text dark:text-foreground"
    >
      {count}
      <span className="text-uipath-orange ml-0.5">{suffix}</span>
    </span>
  );
}

export function StatsBar() {
  return (
    <section className="relative border-y border-uipath-text/10 bg-white/80 py-16 sm:py-20 backdrop-blur-xl dark:border-border dark:bg-card/75">
      {/* Blueprint grid accent */}
      <div className="bg-blueprint pointer-events-none absolute inset-0 opacity-40" />

      <div className="container relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group relative flex flex-col items-center gap-3 p-4 sm:p-6 text-center rounded-xl lg:rounded-none lg:border-l lg:border-uipath-text/10 lg:first:border-l-0 dark:lg:border-border transition-all duration-300 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
              >
                {/* Orange square tick indicator that illuminates on hover */}
                <span className="hidden lg:block absolute left-1/2 top-0 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 border border-uipath-orange bg-white dark:bg-card transition-all duration-300 group-hover:scale-125 group-hover:bg-uipath-orange shadow-sm" />

                {/* Glowing Icon Badge */}
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl border ${stat.iconBg} shadow-sm transition-transform duration-300 group-hover:scale-110`}
                >
                  <Icon className="h-5 w-5" />
                </div>

                {/* Animated Number Counter */}
                <div className="mt-1">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </div>

                {/* Metric Label */}
                <div className="flex flex-col items-center gap-1">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-uipath-text dark:text-foreground">
                    {stat.label}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-uipath-text/5 dark:bg-foreground/5 px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    <TrendingUp className="h-2.5 w-2.5 text-uipath-orange" />
                    {stat.tag}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

