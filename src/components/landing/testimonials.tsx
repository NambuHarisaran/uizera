"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { GripHorizontal, Star } from "lucide-react";
import { SectionHeading } from "@/components/shared/section-heading";

const testimonials = [
  {
    name: "Harish S",
    role: "III Year, CSBS",
    quote:
      "UI Zera completely changed how I see my career. The 30-day certification sprint pushed me to achieve more in a month than I did in a whole semester.",
    rating: 5,
  },
  {
    name: "Priya M",
    role: "II Year, CSE",
    quote:
      "The weekly challenges are incredible. Getting real feedback from coordinators helped me understand automation at a much deeper level.",
    rating: 5,
  },
  {
    name: "Karthik R",
    role: "IV Year, IT",
    quote:
      "I landed my first internship because of the UiPath certifications I completed through this community. The structured learning path made all the difference.",
    rating: 5,
  },
  {
    name: "Divya K",
    role: "II Year, AI & DS",
    quote:
      "The quizzes are so fun and competitive! Seeing my name on the leaderboard motivates me to keep learning every week.",
    rating: 5,
  },
];

/** ReactBits-style draggable card stack: flick the top card to send it to the back. */
function TestimonialStack() {
  const [order, setOrder] = useState(testimonials.map((_, i) => i));
  const [hovered, setHovered] = useState(false);

  const sendToBack = useCallback(() => {
    setOrder(([first, ...rest]) => [...rest, first]);
  }, []);

  useEffect(() => {
    if (hovered) return;
    const id = setInterval(sendToBack, 5000);
    return () => clearInterval(id);
  }, [hovered, sendToBack]);

  return (
    <div
      className="relative mx-auto h-[340px] w-full max-w-md sm:h-[320px]"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
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
              if (Math.abs(info.offset.x) > 120 || Math.abs(info.offset.y) > 120) {
                sendToBack();
              }
            }}
            animate={{
              scale: 1 - stackIndex * 0.05,
              y: stackIndex * 16,
              rotate: isTop ? 0 : (stackIndex % 2 === 0 ? 1 : -1) * stackIndex * 1.6,
            }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            style={{ zIndex: testimonials.length - stackIndex }}
            className={`absolute inset-0 flex flex-col border border-uipath-text/15 bg-white p-7 shadow-card dark:border-border dark:bg-card ${
              isTop ? "cursor-grab active:cursor-grabbing" : "pointer-events-none"
            }`}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex gap-1">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-[#FFB40E] text-[#FFB40E]" />
                ))}
              </div>
              {isTop && (
                <GripHorizontal className="h-4 w-4 text-uipath-mutedText/50" />
              )}
            </div>

            <blockquote className="flex-1 text-sm font-medium leading-relaxed text-uipath-mutedText dark:text-muted-foreground sm:text-base">
              &ldquo;{t.quote}&rdquo;
            </blockquote>

            <div className="mt-5 flex items-center gap-3 border-t border-uipath-text/10 pt-4 dark:border-border">
              <span className="flex h-9 w-9 items-center justify-center bg-uipath-orange font-display text-sm font-bold text-white">
                {t.name.charAt(0)}
              </span>
              <div>
                <p className="font-display text-sm font-bold text-uipath-text dark:text-foreground">
                  {t.name}
                </p>
                <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-uipath-orange">
                  {t.role}
                </p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export function Testimonials() {
  return (
    <section className="relative overflow-hidden border-t border-uipath-text/10 bg-white py-24 dark:border-border dark:bg-card">
      <div className="container mx-auto max-w-6xl">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <div>
            <SectionHeading
              badge="Student Stories"
              title="Hear from Our Community"
              description="Real students, real impact. Drag the top card — or wait, the deck deals itself."
              align="left"
              className="mb-0"
            />
            <div className="mt-8 hidden items-center gap-3 font-mono text-[11px] font-semibold uppercase tracking-widest text-uipath-mutedText dark:text-muted-foreground lg:flex">
              <span className="h-2 w-2 bg-uipath-orange" />
              drag to shuffle
            </div>
          </div>
          <TestimonialStack />
        </div>
      </div>
    </section>
  );
}
