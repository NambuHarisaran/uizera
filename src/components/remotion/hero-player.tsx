"use client";

import { useEffect, useRef, useState } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import { useTheme } from "next-themes";
import { HeroVideoComposition } from "./hero-composition";

export function HeroRemotionPlayer() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const playerRef = useRef<PlayerRef>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const dark = mounted && resolvedTheme === "dark";

  useEffect(() => {
    if (mounted && playerRef.current) {
      playerRef.current.play();
    }
  }, [mounted]);

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
        {mounted ? (
          <Player
            ref={playerRef}
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
        ) : (
          <div className="h-full w-full bg-muted/20 animate-pulse flex items-center justify-center">
            <span className="font-mono text-xs text-muted-foreground">Loading Showcase...</span>
          </div>
        )}
      </div>
    </div>
  );
}
