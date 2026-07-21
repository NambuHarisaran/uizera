"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Award, Calendar, Sparkles, Users } from "lucide-react";
import { SITE } from "@/lib/constants";

const stats = [
  { label: "Community Members", value: SITE.stats.members, suffix: "+", icon: Users },
  { label: "Events Hosted", value: SITE.stats.events, suffix: "+", icon: Calendar },
  { label: "Years Active", value: SITE.stats.years, suffix: "+", icon: Sparkles },
  { label: "Certifications", value: SITE.stats.certifications, suffix: "", icon: Award },
];

function AnimatedCounter({ value, suffix }: { value: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (!inView) return;
    let frame: number;
    const duration = 1500;
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
      className="font-display text-5xl font-extrabold tabular-nums text-uipath-text dark:text-foreground sm:text-6xl"
    >
      {count}
      <span className="text-uipath-orange">{suffix}</span>
    </span>
  );
}

export function StatsBar() {
  return (
    <section className="relative border-t border-uipath-text/10 bg-white py-24 dark:border-border dark:bg-card">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-2 md:grid-cols-4">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group relative flex flex-col items-center gap-2 px-4 py-6 text-center md:border-l md:border-uipath-text/10 md:first:border-l-0 dark:md:border-border"
              >
                {/* Orange square tick that fills on hover */}
                <span className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 border-2 border-uipath-orange transition-colors duration-300 group-hover:bg-uipath-orange" />
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                <span className="flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-widest text-uipath-mutedText dark:text-muted-foreground">
                  <Icon className="h-3.5 w-3.5 text-uipath-orange" />
                  {stat.label}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
