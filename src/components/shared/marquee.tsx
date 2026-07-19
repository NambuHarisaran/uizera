"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MarqueeProps {
  children: ReactNode;
  className?: string;
  /** Seconds per loop. */
  duration?: number;
}

/** Infinite horizontal ticker. Content is duplicated for a seamless loop; pauses on hover. */
export function Marquee({ children, className, duration = 30 }: MarqueeProps) {
  return (
    <div className={cn("marquee overflow-hidden", className)}>
      <div
        className="marquee-track"
        style={{ "--marquee-duration": `${duration}s` } as React.CSSProperties}
      >
        <div className="flex shrink-0 items-center">{children}</div>
        <div className="flex shrink-0 items-center" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}
