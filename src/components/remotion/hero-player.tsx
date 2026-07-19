"use client";

import { useEffect, useState } from "react";
import { Player } from "@remotion/player";
import { useTheme } from "next-themes";
import { HeroVideoComposition } from "./hero-composition";

export function HeroRemotionPlayer() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // First client render must match SSR (light); theme applies after mount.
  const dark = mounted && resolvedTheme === "dark";

  return (
    <div className="relative overflow-hidden border border-uipath-text/15 bg-white p-2 shadow-card dark:border-border dark:bg-card">
      <div className="flex items-center justify-between px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-widest text-uipath-mutedText dark:text-muted-foreground">
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 bg-uipath-orange" />
          Club Showcase
        </span>
        <span className="text-uipath-orange">PSNA CET · UiPath Community</span>
      </div>
      <div className="aspect-video w-full overflow-hidden">
        <Player
          key={dark ? "dark" : "light"}
          component={HeroVideoComposition}
          inputProps={{ dark }}
          durationInFrames={360}
          compositionWidth={800}
          compositionHeight={450}
          fps={30}
          autoPlay
          loop
          clickToPlay={false}
          doubleClickToFullscreen={false}
          spaceKeyToPlayOrPause={false}
          acknowledgeRemotionLicense
          style={{
            width: "100%",
            height: "100%",
          }}
        />
      </div>
    </div>
  );
}
