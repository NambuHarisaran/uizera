"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow?: string;
  badge?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}

export function SectionHeading({
  eyebrow,
  badge,
  title,
  description,
  align = "center",
  className,
}: SectionHeadingProps) {
  const badgeText = eyebrow || badge;
  const words = title.split(" ");

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      className={cn(
        "mx-auto mb-12 max-w-2xl",
        align === "center" ? "text-center" : "text-left",
        className
      )}
    >
      {badgeText && (
        <motion.span
          variants={{
            hidden: { opacity: 0, y: 12 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
          }}
          className={cn(
            "mb-4 inline-flex items-center gap-2 border border-uipath-text/15 bg-white px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-widest text-uipath-text shadow-sm dark:border-border dark:bg-card dark:text-foreground",
            align === "center" ? "mx-auto" : ""
          )}
        >
          <span className="h-2 w-2 bg-uipath-orange" />
          {badgeText}
        </motion.span>
      )}
      <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
        {words.map((word, i) => (
          <motion.span
            key={`${word}-${i}`}
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.45, delay: 0.08 + i * 0.05, ease: "easeOut" },
              },
            }}
            className="inline-block whitespace-pre"
          >
            {word}
            {i < words.length - 1 ? " " : ""}
          </motion.span>
        ))}
      </h2>
      {description && (
        <motion.p
          variants={{
            hidden: { opacity: 0, y: 16 },
            visible: {
              opacity: 1,
              y: 0,
              transition: { duration: 0.5, delay: 0.15 + words.length * 0.05 },
            },
          }}
          className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg"
        >
          {description}
        </motion.p>
      )}
    </motion.div>
  );
}
