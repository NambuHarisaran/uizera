"use client";

import { useEffect, useRef, useState } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import { useTheme } from "next-themes";
import { HeroVideoComposition } from "./hero-composition";

export function HeroRemotionPlayer() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const playerRef = useRef<PlayerRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const dark = mounted && resolvedTheme === "dark";

  // This showcase has no controls a viewer can use to pause it (clickToPlay,
  // doubleClickToFullscreen, spaceKeyToPlayOrPause are all off below), so any
  // time it isn't playing is unintended — a slow autoplay attempt before the
  // tab had focus, a background-tab throttle, etc. Self-heal instead of
  // relying on a single play() call at mount, which is what made this
  // intermittent.
  useEffect(() => {
    if (!mounted) return;
    const player = playerRef.current;
    if (!player) return;

    const tryPlay = () => {
      if (!player.isPlaying()) player.play();
    };

    tryPlay();
    player.addEventListener("pause", tryPlay);
    player.addEventListener("ended", tryPlay);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") tryPlay();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    let observer: IntersectionObserver | undefined;
    if (containerRef.current && "IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) tryPlay();
        },
        { threshold: 0.2 }
      );
      observer.observe(containerRef.current);
    }

    return () => {
      player.removeEventListener("pause", tryPlay);
      player.removeEventListener("ended", tryPlay);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      observer?.disconnect();
    };
  }, [mounted]);

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden border border-uipath-text/15 bg-white p-2 shadow-card dark:border-border dark:bg-card"
    >
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
