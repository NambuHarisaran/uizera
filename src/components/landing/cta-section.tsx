"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Magnetic } from "@/components/shared/magnetic";
import { Parallax } from "@/components/shared/parallax";

export function CtaSection() {
  return (
    <section className="relative overflow-hidden bg-white py-24 dark:bg-card">
      <div className="container mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden bg-uipath-orange p-10 text-center text-white shadow-primary sm:p-16"
        >
          {/* Flat white outline squares drifting at different speeds */}
          <Parallax speed={35} className="pointer-events-none absolute -left-6 top-8">
            <div className="h-20 w-20 rotate-12 border-2 border-white/25" />
          </Parallax>
          <Parallax speed={-30} className="pointer-events-none absolute -right-4 bottom-10">
            <div className="h-14 w-14 -rotate-6 border-2 border-white/25" />
          </Parallax>
          <Parallax speed={50} className="pointer-events-none absolute right-[18%] top-6">
            <div className="h-5 w-5 bg-white/20" />
          </Parallax>
          <Parallax speed={-45} className="pointer-events-none absolute left-[15%] bottom-6">
            <div className="h-4 w-4 bg-white/25" />
          </Parallax>

          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
            className="mx-auto mb-7 flex h-16 w-16 items-center justify-center border-2 border-white bg-white/10"
          >
            <Bot className="h-8 w-8" />
          </motion.div>

          <h2 className="font-display text-3xl font-extrabold leading-tight sm:text-4xl md:text-5xl">
            Ready to Automate Your Career?
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-white sm:text-lg">
            Join 100+ students who are already building the future with UiPath.
            Start earning coins, completing certifications, and climbing the
            leaderboard today.
          </p>

          <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Magnetic>
              <Button
                asChild
                size="lg"
                className="rounded-none bg-white px-8 text-base font-bold text-uipath-orange shadow-lg hover:bg-uipath-bg"
              >
                <Link href="/login" className="flex items-center gap-2">
                  Join Now — It&apos;s Free
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </Magnetic>

            <Magnetic strength={0.2}>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-none border-2 border-white bg-transparent px-8 text-base font-bold text-white hover:bg-white hover:text-uipath-orange"
              >
                <Link href="/contact">Contact Us</Link>
              </Button>
            </Magnetic>
          </div>

          <p className="mt-8 font-mono text-[10px] font-semibold uppercase tracking-[0.3em] text-white/90">
            no fees · no experience needed · all departments welcome
          </p>
        </motion.div>
      </div>
    </section>
  );
}
