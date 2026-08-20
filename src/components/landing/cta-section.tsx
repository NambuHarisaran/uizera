"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Bot, Sparkles, CheckCircle2, ShieldCheck, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Magnetic } from "@/components/shared/magnetic";
import { Parallax } from "@/components/shared/parallax";
import { SITE } from "@/lib/constants";

const VALUE_PROPS = [
  "100% Free Lifetime Membership",
  "Official UiPath Cert Prep",
  "Zero Prior Coding Required",
  "PSNA CET Student Exclusives",
] as const;

export function CtaSection() {
  return (
    <section className="relative overflow-hidden bg-white py-24 sm:py-28 dark:bg-card">
      <div className="container relative mx-auto max-w-5xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#FA4616] via-[#E53E12] to-[#B82E08] p-8 sm:p-14 lg:p-16 text-center text-white shadow-2xl shadow-orange-500/30"
        >
          {/* Subtle multi-layer geometric mesh backdrop */}
          <div className="bg-blueprint pointer-events-none absolute inset-0 opacity-15" />
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-uipath-blue/20 blur-3xl" />

          {/* Parallax drifting geometric squares */}
          <Parallax speed={35} className="pointer-events-none absolute -left-6 top-8">
            <div className="h-20 w-20 rotate-12 border-2 border-white/20" />
          </Parallax>
          <Parallax speed={-30} className="pointer-events-none absolute -right-4 bottom-10">
            <div className="h-14 w-14 -rotate-6 border-2 border-white/20" />
          </Parallax>
          <Parallax speed={50} className="pointer-events-none absolute right-[18%] top-6">
            <div className="h-5 w-5 bg-white/20" />
          </Parallax>
          <Parallax speed={-45} className="pointer-events-none absolute left-[15%] bottom-6">
            <div className="h-4 w-4 bg-white/25" />
          </Parallax>

          {/* Bot Mascot Icon with pulsating rings */}
          <div className="relative mx-auto mb-8 inline-block">
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
              className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-white/80 bg-white/15 backdrop-blur-md shadow-lg"
            >
              <Bot className="h-8 w-8 text-white" />
            </motion.div>
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
              <span className="relative inline-flex h-4 w-4 rounded-full bg-uipath-gold" />
            </span>
          </div>

          <h2 className="font-display text-3xl font-extrabold leading-tight sm:text-4xl md:text-5xl">
            Ready to Automate Your Engineering Career?
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-base sm:text-lg leading-relaxed text-white/90">
            Join over 100+ students already building robots, claiming certification bounties, and topping the PSNA CET leaderboard with UiPath.
          </p>

          {/* Value Prop Chips */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
            {VALUE_PROPS.map((vp) => (
              <span
                key={vp}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-1 font-mono text-[11px] font-semibold text-white backdrop-blur-sm shadow-sm"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-uipath-gold" />
                {vp}
              </span>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row sm:justify-center items-stretch sm:items-center gap-4">
            <Magnetic>
              <Button
                asChild
                size="lg"
                className="relative group rounded-none bg-white px-8 py-6 text-base font-extrabold text-[#FA4616] shadow-xl hover:bg-white/95 hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-200"
              >
                <Link href="/login" className="flex items-center justify-center gap-2.5">
                  <span>Join Now — It&apos;s Free</span>
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
              </Button>
            </Magnetic>

            <Magnetic strength={0.2}>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-none border-2 border-white bg-transparent px-8 py-6 text-base font-bold text-white hover:bg-white hover:text-[#FA4616] transition-all duration-200"
              >
                <Link href="/contact" className="flex items-center justify-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>Contact Coordinators</span>
                </Link>
              </Button>
            </Magnetic>
          </div>

          <p className="mt-8 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-white/80">
            {SITE.name} · {SITE.college} · {SITE.department}
          </p>
        </motion.div>
      </div>
    </section>
  );
}

