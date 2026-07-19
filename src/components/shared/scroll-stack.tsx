"use client";

import { useRef, type ReactNode } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { cn } from "@/lib/utils";

interface ScrollStackProps {
  children: ReactNode[];
  className?: string;
  /** Sticky offset from viewport top for the first card, px. */
  topOffset?: number;
  /** Extra offset added per card so the stack fans out, px. */
  gap?: number;
}

interface StackItemProps {
  index: number;
  total: number;
  progress: MotionValue<number>;
  topOffset: number;
  gap: number;
  children: ReactNode;
}

function StackItem({ index, total, progress, topOffset, gap, children }: StackItemProps) {
  // As later cards scroll in, earlier ones shrink slightly so the pile reads as depth.
  const targetScale = 1 - (total - 1 - index) * 0.045;
  const scale = useTransform(progress, [index / total, 1], [1, targetScale]);

  return (
    <div
      className="sticky"
      style={{ top: topOffset + index * gap, zIndex: index + 1 }}
    >
      <motion.div style={{ scale, transformOrigin: "top center" }}>
        {children}
      </motion.div>
    </div>
  );
}

/**
 * ReactBits-style scroll card stack: cards pin as you scroll and pile on top
 * of each other, previous cards scaling back for depth.
 */
export function ScrollStack({ children, className, topOffset = 96, gap = 24 }: ScrollStackProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  const total = children.length;

  return (
    <div ref={ref} className={cn("relative flex flex-col gap-10", className)}>
      {children.map((child, i) => (
        <StackItem
          key={i}
          index={i}
          total={total}
          progress={scrollYProgress}
          topOffset={topOffset}
          gap={gap}
        >
          {child}
        </StackItem>
      ))}
    </div>
  );
}
