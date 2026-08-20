"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { GripHorizontal, Star, ShieldCheck, Sparkles, CheckCircle2, ChevronRight, ChevronLeft } from "lucide-react";
import { SectionHeading } from "@/components/shared/section-heading";

const testimonials = [
  {
    name: "Harish S",
    role: "III Year, CSBS",
    achievement: "UiPath Certified Associate",
    quote:
      "UiZera completely changed how I see my career. The 30-day certification sprint pushed me to achieve more in a single month than I did across an entire semester.",
    rating: 5,
    tagColor: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
    avatarBg: "bg-uipath-orange text-white shadow-orange-500/30",
  },
  {
    name: "Priya M",
    role: "II Year, CSE",
    achievement: "Weekly Challenge Winner",
    quote:
      "The weekly challenges are incredible. Getting real code reviews from chapter coordinators helped me understand studio activity architecture at a much deeper enterprise level.",
    rating: 5,
    tagColor: "bg-blue-500/10 text-uipath-blue dark:text-blue-400 border-blue-500/20",
    avatarBg: "bg-uipath-blue text-white shadow-blue-500/30",
  },
  {
    name: "Karthik R",
    role: "IV Year, IT",
    achievement: "RPA Internship Placed",
    quote:
      "I landed my first enterprise internship primarily because of the UiPath portfolio and credentials I completed through UiZera. The structured learning roadmap made all the difference.",
    rating: 5,
    tagColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    avatarBg: "bg-uipath-success text-slate-950 shadow-emerald-500/30",
  },
  {
    name: "Divya K",
    role: "II Year, AI & DS",
    achievement: "Top 3 Leaderboard",
    quote:
      "The quizzes are exhilarating and fast-paced! Seeing my ranking climb on the live leaderboard motivates me to explore advanced agentic workflows every single week.",
    rating: 5,
    tagColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    avatarBg: "bg-uipath-gold text-slate-950 shadow-amber-500/30",
  },
];

/** ReactBits-style draggable card stack with pagination dots & gesture controls. */
function TestimonialStack() {
  const [order, setOrder] = useState(testimonials.map((_, i) => i));
  const [hovered, setHovered] = useState(false);

  const sendToBack = useCallback(() => {
    setOrder(([first, ...rest]) => [...rest, first]);
  }, []);

  const bringToFront = useCallback(() => {
    setOrder((prev) => [prev[prev.length - 1], ...prev.slice(0, prev.length - 1)]);
  }, []);

  useEffect(() => {
    if (hovered) return;
    const id = setInterval(sendToBack, 5500);
    return () => clearInterval(id);
  }, [hovered, sendToBack]);

  const activeIndex = order[0];

  return (
    <div
      className="flex flex-col items-center"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative mx-auto h-[380px] w-full max-w-lg sm:h-[350px]">
        {testimonials.map((t, i) => {
          const stackIndex = order.indexOf(i);
          const isTop = stackIndex === 0;
          return (
            <motion.div
              key={t.name}
              drag={isTop}
              dragElastic={0.6}
              dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
              onDragEnd={(_, info) => {
                if (Math.abs(info.offset.x) > 100 || Math.abs(info.offset.y) > 100) {
                  sendToBack();
                }
              }}
              animate={{
                scale: 1 - stackIndex * 0.045,
                y: stackIndex * 14,
                rotate: isTop ? 0 : (stackIndex % 2 === 0 ? 1 : -1) * stackIndex * 1.5,
                opacity: stackIndex > 2 ? 0 : 1,
              }}
              transition={{ type: "spring", stiffness: 280, damping: 24 }}
              style={{ zIndex: testimonials.length - stackIndex }}
              className={`absolute inset-0 flex flex-col justify-between overflow-hidden rounded-xl border border-uipath-text/15 bg-white/95 backdrop-blur-xl p-6 sm:p-8 shadow-card transition-shadow duration-300 hover:shadow-card-hover dark:border-border dark:bg-card/95 ${
                isTop ? "cursor-grab active:cursor-grabbing shadow-xl" : "pointer-events-none"
              }`}
            >
              {/* Header with stars & achievement tag */}
              <div>
                <div className="mb-4 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <div className="flex gap-1">
                      {Array.from({ length: t.rating }).map((_, j) => (
                        <Star key={j} className="h-4 w-4 fill-[#FFB40E] text-[#FFB40E]" />
                      ))}
                    </div>
                    <span className="ml-2 font-mono text-[10px] font-bold text-muted-foreground">
                      5.0 Verified
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${t.tagColor}`}>
                      <Sparkles className="h-2.5 w-2.5" />
                      {t.achievement}
                    </span>
                    {isTop && (
                      <GripHorizontal className="h-4 w-4 text-muted-foreground/40" />
                    )}
                  </div>
                </div>

                <blockquote className="line-clamp-4 text-base font-normal leading-relaxed text-foreground/90 sm:text-lg italic">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
              </div>

              {/* Author Footer */}
              <div className="mt-6 flex items-center justify-between border-t border-uipath-text/10 pt-4 dark:border-border">
                <div className="flex items-center gap-3.5">
                  <span className={`flex h-11 w-11 items-center justify-center rounded-xl font-display text-base font-extrabold shadow-md ${t.avatarBg}`}>
                    {t.name.charAt(0)}
                  </span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="font-display text-base font-bold text-uipath-text dark:text-foreground">
                        {t.name}
                      </p>
                      <CheckCircle2 className="h-3.5 w-3.5 text-uipath-blue fill-uipath-blue/20" />
                    </div>
                    <p className="font-mono text-xs font-semibold uppercase tracking-wider text-uipath-orange">
                      {t.role}
                    </p>
                  </div>
                </div>

                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                  PSNA Chapter
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Interactive Deck Navigation Dots */}
      <div className="mt-8 flex items-center gap-3">
        <button
          onClick={bringToFront}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm transition-all hover:bg-muted"
          aria-label="Previous testimonial"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                const currentIndex = order.indexOf(i);
                if (currentIndex > 0) {
                  setOrder((prev) => {
                    const next = [...prev];
                    const [item] = next.splice(currentIndex, 1);
                    return [item, ...next];
                  });
                }
              }}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                activeIndex === i ? "w-7 bg-uipath-orange" : "w-2.5 bg-muted-foreground/30 hover:bg-muted-foreground/60"
              }`}
              aria-label={`Jump to testimonial ${i + 1}`}
            />
          ))}
        </div>

        <button
          onClick={sendToBack}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm transition-all hover:bg-muted"
          aria-label="Next testimonial"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function Testimonials() {
  return (
    <section className="relative overflow-hidden border-t border-uipath-text/10 bg-white py-24 sm:py-28 dark:border-border dark:bg-card">
      <div className="container relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-14 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <SectionHeading
              badge="Student Success Stories"
              title="Hear from Our Community Champions"
              description="Real student experiences from PSNA CET. Drag or flick the card stack to shuffle through peer achievements and career journeys."
              align="left"
              className="mb-0"
            />

            <div className="mt-8 flex flex-col gap-3 font-mono text-xs text-muted-foreground">
              <div className="flex items-center gap-2 font-semibold">
                <ShieldCheck className="h-4 w-4 text-uipath-success" />
                <span>100% Verified PSNA CET Students</span>
              </div>
              <div className="flex items-center gap-2 font-semibold">
                <Sparkles className="h-4 w-4 text-uipath-orange" />
                <span>Interactive live card deck · Auto-rotating</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <TestimonialStack />
          </div>
        </div>
      </div>
    </section>
  );
}

