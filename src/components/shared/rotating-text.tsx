"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface RotatingTextProps {
  words: readonly string[];
  interval?: number;
  className?: string;
}

/**
 * ReactBits-style rotating text: cycles through words with a per-letter
 * spring stagger. Solid colors only — the emphasis comes from motion.
 */
export function RotatingText({ words, interval = 2800, className }: RotatingTextProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % words.length), interval);
    return () => clearInterval(id);
  }, [words.length, interval]);

  const word = words[index];

  return (
    <span className={cn("relative inline-flex overflow-hidden align-bottom", className)}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span key={word} className="inline-flex whitespace-nowrap">
          {word.split("").map((char, i) => (
            <motion.span
              key={`${word}-${i}`}
              initial={{ y: "115%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "-115%", opacity: 0 }}
              transition={{
                type: "spring",
                damping: 28,
                stiffness: 340,
                delay: i * 0.018,
              }}
              className="inline-block"
            >
              {char === " " ? " " : char}
            </motion.span>
          ))}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
