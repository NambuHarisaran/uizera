"use client";

import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

const ORANGE = "#FA4616";
const BLUE = "#0067DF";
const GOLD = "#FFB40E";

interface HeroVideoProps {
  dark?: boolean;
}

interface Slide {
  activity: string;
  badge: string;
  title: string;
  subtitle: string;
  color: string;
}

const slides: Slide[] = [
  {
    activity: "SEQUENCE",
    badge: "DINDIGUL HERITAGE · PSNA CET",
    title: "Pioneering Tech Education",
    subtitle: "Department of Computer Science & Business Systems",
    color: BLUE,
  },
  {
    activity: "ROBOT",
    badge: "UIPATH FIRST TAMIL COMMUNITY",
    title: "UiZera Club",
    subtitle: "Empowering 100+ Students with RPA & Agentic AI",
    color: ORANGE,
  },
  {
    activity: "INVOKE WORKFLOW",
    badge: "INDUSTRY 4.0 · AUTOMATION",
    title: "Build Intelligent Robots",
    subtitle: "UiPath Studio · Orchestrator · Enterprise AI Skills",
    color: BLUE,
  },
  {
    activity: "ACHIEVEMENT",
    badge: "GAMIFIED LEARNING SPRINT",
    title: "Quizzes, Coins & Leaderboard",
    subtitle: "Earn 1,000+ Coins · Unlock Legend Badges",
    color: GOLD,
  },
];

const FRAMES_PER_SLIDE = 90;

export function HeroVideoComposition({ dark = false }: HeroVideoProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const theme = dark
    ? {
        bg: "#0E1116",
        card: "#14171C",
        text: "#F5F7F9",
        muted: "#9AA3AD",
        line: "rgba(255,255,255,0.06)",
        border: "rgba(255,255,255,0.14)",
      }
    : {
        bg: "#F1F6F8",
        card: "#FFFFFF",
        text: "#000000",
        muted: "#58595B",
        line: "rgba(0,103,223,0.08)",
        border: "rgba(0,0,0,0.12)",
      };

  const slideIndex = Math.floor(frame / FRAMES_PER_SLIDE) % slides.length;
  const localFrame = frame % FRAMES_PER_SLIDE;
  const current = slides[slideIndex] || slides[0]!;

  const cardOpacity = interpolate(localFrame, [0, 12, 78, 90], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const cardSpring = spring({ frame: localFrame, fps, config: { damping: 14 } });
  const cardY = interpolate(cardSpring, [0, 1], [26, 0]);

  // Typewriter subtitle
  const typedChars = Math.floor(
    interpolate(localFrame, [16, 62], [0, current.subtitle.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );
  const typed = current.subtitle.slice(0, typedChars);
  const cursorOn = Math.floor(frame / 8) % 2 === 0;

  // Stepper wire fill across the whole loop
  const stepProgress = (slideIndex + localFrame / FRAMES_PER_SLIDE) / slides.length;

  // Blinking status dot
  const dotOn = Math.floor(frame / 15) % 2 === 0;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: theme.bg,
        backgroundImage: `linear-gradient(to right, ${theme.line} 1px, transparent 1px), linear-gradient(to bottom, ${theme.line} 1px, transparent 1px)`,
        backgroundSize: "36px 36px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, -apple-system, sans-serif",
        padding: 40,
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* HUD header */}
      <div
        style={{
          position: "absolute",
          top: 20,
          left: 24,
          right: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontFamily: "ui-monospace, monospace",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 2,
          color: theme.muted,
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              width: 9,
              height: 9,
              background: ORANGE,
              opacity: dotOn ? 1 : 0.25,
            }}
          />
          UI ZERA · AUTOMATION SHOWCASE
        </span>
        <span>
          {String(slideIndex + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
        </span>
      </div>

      {/* Decorative rotating squares */}
      <div
        style={{
          position: "absolute",
          top: 70,
          left: 40,
          width: 26,
          height: 26,
          border: `2px solid ${ORANGE}`,
          opacity: 0.35,
          transform: `rotate(${frame * 0.5}deg)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 66,
          right: 48,
          width: 18,
          height: 18,
          background: BLUE,
          opacity: 0.3,
          transform: `rotate(${-frame * 0.7}deg)`,
        }}
      />

      {/* Workflow stepper */}
      <div
        style={{
          position: "absolute",
          top: 58,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          alignItems: "center",
        }}
      >
        {slides.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center" }}>
            {i > 0 && (
              <div style={{ width: 46, height: 2, background: theme.border, position: "relative" }}>
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: ORANGE,
                    width: `${Math.min(Math.max((stepProgress * slides.length - i + 1) * 100, 0), 100)}%`,
                  }}
                />
              </div>
            )}
            <div
              style={{
                width: 14,
                height: 14,
                border: `2px solid ${i <= slideIndex ? ORANGE : theme.border}`,
                background: i < slideIndex ? ORANGE : i === slideIndex ? s.color : "transparent",
              }}
            />
          </div>
        ))}
      </div>

      {/* Slide card — Studio activity node */}
      <div
        style={{
          opacity: cardOpacity,
          transform: `translateY(${cardY}px) scale(${0.94 + cardSpring * 0.06})`,
          width: "100%",
          maxWidth: 620,
          background: theme.card,
          border: `1px solid ${theme.border}`,
          boxShadow: dark
            ? "0 18px 44px rgba(0,0,0,0.5)"
            : "0 18px 44px rgba(0,103,223,0.12)",
          position: "relative",
        }}
      >
        {/* Activity title bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: current.color,
            color: "#FFFFFF",
            padding: "10px 18px",
            fontFamily: "ui-monospace, monospace",
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: 2,
          }}
        >
          <span style={{ width: 10, height: 10, background: "#FFFFFF" }} />
          {current.activity}
          <span style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            <span style={{ width: 6, height: 6, background: "rgba(255,255,255,0.5)" }} />
            <span style={{ width: 6, height: 6, background: "rgba(255,255,255,0.5)" }} />
            <span style={{ width: 6, height: 6, background: "rgba(255,255,255,0.5)" }} />
          </span>
        </div>

        <div style={{ padding: "28px 36px 32px", textAlign: "center" }}>
          <div
            style={{
              display: "inline-block",
              padding: "5px 14px",
              border: `1px solid ${current.color}`,
              color: current.color,
              fontFamily: "ui-monospace, monospace",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 2,
              marginBottom: 16,
            }}
          >
            {current.badge}
          </div>

          <h2
            style={{
              fontSize: 36,
              fontWeight: 800,
              color: theme.text,
              margin: "0 0 12px 0",
              lineHeight: 1.15,
            }}
          >
            {current.title}
          </h2>

          <p
            style={{
              fontSize: 16,
              color: theme.muted,
              margin: 0,
              fontWeight: 500,
              fontFamily: "ui-monospace, monospace",
              minHeight: 22,
            }}
          >
            {typed}
            <span
              style={{
                display: "inline-block",
                width: 9,
                height: 16,
                marginLeft: 2,
                verticalAlign: "middle",
                background: current.color,
                opacity: cursorOn ? 1 : 0,
              }}
            />
          </p>
        </div>

        {/* Corner brackets */}
        {(
          [
            { top: -2, left: -2, borderWidth: "3px 0 0 3px" },
            { top: -2, right: -2, borderWidth: "3px 3px 0 0" },
            { bottom: -2, left: -2, borderWidth: "0 0 3px 3px" },
            { bottom: -2, right: -2, borderWidth: "0 3px 3px 0" },
          ] as const
        ).map((pos, i) => (
          <span
            key={i}
            style={{
              position: "absolute",
              width: 16,
              height: 16,
              borderStyle: "solid",
              borderColor: ORANGE,
              ...pos,
            }}
          />
        ))}
      </div>

      {/* Footer strip */}
      <div
        style={{
          position: "absolute",
          bottom: 20,
          fontFamily: "ui-monospace, monospace",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 3,
          color: theme.muted,
        }}
      >
        PSNA CET · DIGITAL WORKFORCE · EST. 2023
      </div>
    </div>
  );
}
