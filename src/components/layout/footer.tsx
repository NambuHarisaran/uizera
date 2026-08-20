"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/layout/logo";
import {
  ArrowUp,
  Award,
  BookOpen,
  Calendar,
  Crown,
  ExternalLink,
  Flame,
  Gamepad2,
  Heart,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Megaphone,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  Users,
} from "lucide-react";
import { SITE } from "@/lib/constants";
import { Magnetic } from "@/components/shared/magnetic";
import { cn } from "@/lib/utils";

export function BackToTop({ className }: { className?: string }) {
  const [visible, setVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollHeight =
        document.documentElement.scrollHeight - window.innerHeight;

      if (scrollHeight > 0) {
        const progress = Math.min(
          100,
          Math.max(0, (currentScrollY / scrollHeight) * 100)
        );
        setScrollProgress(progress);
      }

      setVisible(currentScrollY > 300);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (scrollProgress / 100) * circumference;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.6, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.6, y: 20 }}
          transition={{ duration: 0.25, ease: [0.21, 0.47, 0.32, 0.98] }}
          className={cn("fixed bottom-6 right-6 z-40", className)}
        >
          <motion.button
            whileHover={{ scale: 1.1, y: -2 }}
            whileTap={{ scale: 0.92 }}
            onClick={scrollToTop}
            aria-label="Back to top"
            className="group relative flex h-12 w-12 items-center justify-center rounded-full border border-border/80 bg-background/90 p-0 text-foreground shadow-lg backdrop-blur-md transition-shadow hover:border-brand-500/50 hover:shadow-brand-500/20 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 cursor-pointer"
          >
            {/* SVG Circular Progress Ring */}
            <svg
              className="absolute inset-0 h-full w-full -rotate-90 pointer-events-none"
              viewBox="0 0 44 44"
            >
              <circle
                cx="22"
                cy="22"
                r={radius}
                className="stroke-muted-foreground/20 fill-none"
                strokeWidth="2.5"
              />
              <circle
                cx="22"
                cy="22"
                r={radius}
                className="stroke-uipath-orange fill-none transition-all duration-150"
                strokeWidth="2.5"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>

            {/* Inner Arrow Up Icon */}
            <ArrowUp className="h-5 w-5 transition-transform duration-200 group-hover:-translate-y-0.5 text-foreground group-hover:text-uipath-orange" />
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative border-t border-border/60 bg-card/40 backdrop-blur-lg overflow-hidden">
      {/* Top subtle orange accent highlight line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-uipath-orange/40 to-transparent pointer-events-none" />

      {/* Background blueprint subtle pattern */}
      <div className="absolute inset-0 bg-blueprint opacity-35 pointer-events-none" />

      <div className="container relative py-14 lg:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-12">
          {/* Brand & Mission Column */}
          <div className="lg:col-span-4 space-y-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 font-display text-lg font-bold group"
            >
              <Logo
                width={140}
                height={46}
                imgClassName="h-9 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
              />
            </Link>

            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              {SITE.description}
            </p>

            {/* Active Student Community Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Official UiPath Student Community · PSNA CET
            </div>

            {/* Social Links with Magnetic Pull */}
            <div className="pt-2 flex items-center gap-3">
              <Magnetic strength={0.3}>
                <a
                  href={SITE.social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="UiZera on Instagram"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/80 bg-background/60 text-muted-foreground transition-all duration-200 hover:border-pink-500/50 hover:bg-pink-500/10 hover:text-pink-500 hover:shadow-sm"
                >
                  <Instagram className="h-4 w-4" />
                </a>
              </Magnetic>

              <Magnetic strength={0.3}>
                <a
                  href={SITE.social.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="UiZera on LinkedIn"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/80 bg-background/60 text-muted-foreground transition-all duration-200 hover:border-blue-500/50 hover:bg-blue-500/10 hover:text-blue-500 hover:shadow-sm"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
              </Magnetic>

              <Magnetic strength={0.3}>
                <a
                  href={`mailto:${SITE.email}`}
                  aria-label="Email UiZera"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/80 bg-background/60 text-muted-foreground transition-all duration-200 hover:border-uipath-orange/50 hover:bg-uipath-orange/10 hover:text-uipath-orange hover:shadow-sm"
                >
                  <Mail className="h-4 w-4" />
                </a>
              </Magnetic>
            </div>
          </div>

          {/* Quick Links Column: Community */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">
              Community
            </h3>
            <ul className="space-y-2 text-sm">
              {[
                { href: "/about", label: "About UiZera", icon: Sparkles },
                { href: "/team", label: "Team & Leadership", icon: Users },
                { href: "/announcements", label: "Announcements", icon: Megaphone },
                { href: "/events", label: "Events & Workshops", icon: Calendar },
                { href: "/gallery", label: "Photo Gallery", icon: Sparkles },
                { href: "/contact", label: "Contact Us", icon: Mail },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <span className="h-1 w-1 rounded-full bg-brand-500/40 transition-transform group-hover:scale-150 group-hover:bg-brand-500" />
                    <span>{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links Column: Learn & Compete */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">
              Learn & Compete
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/quiz"
                  className="group inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <span className="h-1 w-1 rounded-full bg-uipath-orange/50 transition-transform group-hover:scale-150 group-hover:bg-uipath-orange" />
                  <span>Quizzes</span>
                  <span className="rounded bg-uipath-orange/15 px-1.5 py-0.2 text-[10px] font-bold text-uipath-orange">
                    PLAY
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  href="/challenges"
                  className="group inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <span className="h-1 w-1 rounded-full bg-brand-500/50 transition-transform group-hover:scale-150 group-hover:bg-brand-500" />
                  <span>Weekly Challenges</span>
                  <span className="rounded bg-brand-500/15 px-1.5 py-0.2 text-[10px] font-bold text-brand-500">
                    NEW
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  href="/certifications"
                  className="group inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <span className="h-1 w-1 rounded-full bg-muted-foreground/40 transition-transform group-hover:scale-150" />
                  <span>30-Day Certifications</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/achievements"
                  className="group inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <span className="h-1 w-1 rounded-full bg-amber-500/50 transition-transform group-hover:scale-150 group-hover:bg-amber-500" />
                  <span>Achievements & Level</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/champions"
                  className="group inline-flex items-center gap-2 text-amber-500 font-semibold transition-colors hover:text-amber-400"
                >
                  <Crown className="h-3.5 w-3.5" />
                  <span>Champions Selection</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/leaderboard"
                  className="group inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <span className="h-1 w-1 rounded-full bg-muted-foreground/40 transition-transform group-hover:scale-150" />
                  <span>Leaderboard</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/resources"
                  className="group inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <span className="h-1 w-1 rounded-full bg-muted-foreground/40 transition-transform group-hover:scale-150" />
                  <span>Learning Resources</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links Column: Legal & Campus */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">
              Explore & Legal
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/privacy"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <a
                  href="https://www.psnacet.edu.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <span>PSNA CET</span>
                  <ExternalLink className="h-3 w-3 opacity-60" />
                </a>
              </li>
              <li>
                <Link
                  href="/host"
                  className="text-xs text-muted-foreground/80 hover:text-foreground transition-colors"
                >
                  Host Portal
                </Link>
              </li>
              <li>
                <Link
                  href="/admin"
                  className="text-xs text-muted-foreground/80 hover:text-foreground transition-colors"
                >
                  Admin Portal
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col gap-4 border-t border-border/60 pt-8 text-xs sm:text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 shrink-0 text-uipath-orange" />
              {SITE.college}, {SITE.location}
            </span>
            <span className="hidden sm:inline text-border">·</span>
            <a
              href={`mailto:${SITE.email}`}
              className="flex items-center gap-1.5 transition-colors hover:text-foreground"
            >
              <Mail className="h-4 w-4 shrink-0 text-brand-500" />
              {SITE.email}
            </a>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-accent/40 px-3 py-1 text-xs font-semibold text-foreground">
              <span>Built by UiZera Club</span>
              <span className="text-uipath-orange font-bold">@ PSNA CET</span>
            </div>
            <p className="text-xs text-muted-foreground">
              © {currentYear} {SITE.name}. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      {/* Floating Back to Top Button */}
      <BackToTop />
    </footer>
  );
}

