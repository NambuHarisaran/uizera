"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CheckCircle2,
  Clock,
  HelpCircle,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  MessageCircle,
  Send,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Spinner } from "@/components/shared/spinner";
import { contactSchema } from "@/lib/validation";
import { SITE } from "@/lib/constants";
import type { z } from "zod";

type FormData = z.infer<typeof contactSchema>;

const contactInfo = [
  { icon: Mail, label: "Official Email", value: SITE.email, href: `mailto:${SITE.email}`, actionText: "Send Email" },
  { icon: MapPin, label: "Community Hub", value: `${SITE.department}, ${SITE.college}, ${SITE.location}`, href: "https://maps.google.com/?q=PSNA+College+of+Engineering+and+Technology", actionText: "View on Maps" },
];

const socials = [
  { icon: Instagram, label: "Instagram", href: SITE.social.instagram, handle: "@psna_uizeraclub" },
  { icon: Linkedin, label: "LinkedIn", href: SITE.social.linkedin, handle: "UiZera Club PSNA CET" },
];

const FAQS = [
  {
    q: "Who can join the UiZera Community?",
    a: "UiZera is open to all students across all engineering departments (CSBS, CSE, IT, AI&DS, ECE, EEE, MECH, CIVIL) at PSNA CET interested in automation, RPA, and Agentic AI.",
  },
  {
    q: "How do coin rewards and the Leaderboard work?",
    a: "You earn coins and XP by participating in live and async quizzes, submitting approved weekly RPA challenges, and completing the 30-Day Certification sprint. Rankings update in real time on the Leaderboard.",
  },
  {
    q: "How do I become eligible for the UiPath Student Developer Champion (SDC) role?",
    a: "Reach Level 40 (Champion rank) on UiZera by accumulating lifetime XP. Once Level 40 is unlocked, you can submit your portfolio on the Champions page for interview consideration.",
  },
  {
    q: "Are the UiPath certification courses free?",
    a: "Yes! Through the UiPath Academic Alliance partnership at PSNA CET, students get free access to UiPath Academy certification pathways, Studio licenses, and guided mentor bootcamps.",
  },
];

export function ContactContent() {
  const [submitted, setSubmitted] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string>("General Inquiry");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(contactSchema),
  });

  const messageVal = watch("message") || "";

  const onSubmit = async (data: FormData) => {
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          message: `[Topic: ${selectedTopic}]\n${data.message}`,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error((body as { error?: string })?.error ?? "Failed to send message.");
      }
      setSubmitted(true);
      reset();
      toast.success("Message sent! The UiZera team will respond within 24 hours.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  return (
    <div className="pb-24">
      {/* Hero */}
      <section className="hero-glow relative overflow-hidden py-20 border-b">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-20" />
        <div className="container relative">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-3xl text-center"
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-sm font-semibold text-brand-600 dark:text-brand-400">
              <MessageCircle className="h-4 w-4" />
              Get In Touch
            </div>
            <h1 className="font-display text-4xl font-extrabold sm:text-5xl tracking-tight">
              Connect with <span className="text-gradient">UiZera</span>
            </h1>
            <p className="mt-3 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              Have a question about RPA courses, weekly quizzes, hackathons, or want to collaborate with our student developers?
            </p>
          </motion.div>
        </div>
      </section>

      <section className="container py-12 max-w-6xl space-y-16">
        <div className="grid gap-12 lg:grid-cols-5">
          {/* Contact Details & Socials Column */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="space-y-8 lg:col-span-2"
          >
            <div>
              <h2 className="font-display text-2xl font-bold">Community Contacts</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Reach out directly to the faculty coordinator or core student leads.
              </p>
            </div>

            <div className="space-y-4">
              {contactInfo.map((c) => {
                const Icon = c.icon;
                return (
                  <div
                    key={c.label}
                    className="rounded-2xl border p-4 bg-card/60 space-y-3 hover:border-brand-500/30 transition-all"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground">{c.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                          {c.value}
                        </p>
                      </div>
                    </div>

                    {c.href && (
                      <div className="pt-2 border-t flex justify-end">
                        <a
                          href={c.href}
                          target={c.href.startsWith("http") ? "_blank" : undefined}
                          rel="noopener noreferrer"
                          className="text-xs font-bold text-brand-500 hover:underline inline-flex items-center gap-1"
                        >
                          {c.actionText} →
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Social Handles */}
            <div className="space-y-3">
              <h3 className="font-display text-base font-bold">Follow Our Channels</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {socials.map((s) => {
                  const Icon = s.icon;
                  return (
                    <a
                      key={s.label}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-xl border p-3 bg-card/40 transition-all hover:border-brand-500/50 hover:bg-brand-500/5"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-foreground">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate">{s.label}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{s.handle}</p>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Response SLA Note */}
            <div className="rounded-2xl border border-brand-500/20 bg-brand-500/5 p-4 flex items-center gap-3">
              <Clock className="h-5 w-5 text-brand-500 shrink-0" />
              <div className="text-xs">
                <p className="font-bold text-foreground">Fast Response Assurance</p>
                <p className="text-muted-foreground">We usually reply within 24 hours on college working days.</p>
              </div>
            </div>
          </motion.div>

          {/* Form Column */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-3"
          >
            {submitted ? (
              <div className="flex flex-col items-center rounded-3xl border border-emerald-500/30 bg-emerald-500/5 p-12 text-center shadow-lg">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-500 ring-4 ring-emerald-500/20">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="font-display text-2xl font-bold">Message Received!</h3>
                <p className="mt-2 text-sm text-muted-foreground max-w-md">
                  Thank you for contacting UiZera Club. A member of the student coordinator team or faculty in-charge will get back to you shortly.
                </p>
                <Button onClick={() => setSubmitted(false)} variant="outline" className="mt-6 rounded-xl">
                  Send Another Message
                </Button>
              </div>
            ) : (
              <div className="rounded-3xl border bg-card p-6 sm:p-8 shadow-xl space-y-6">
                <div>
                  <h3 className="font-display text-xl font-bold">Send us a Message</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Fill out the form below and we will route it to the respective coordinator.
                  </p>
                </div>

                {/* Topic Selector Chips */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Inquiry Topic</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      "General Inquiry",
                      "Quiz & Leaderboard",
                      "SDC Champion Program",
                      "Workshop / Event Collaboration",
                      "Join Core Team",
                    ].map((topic) => (
                      <button
                        key={topic}
                        type="button"
                        onClick={() => setSelectedTopic(topic)}
                        className={`rounded-xl border px-3 py-1 text-xs font-medium transition-all ${
                          selectedTopic === topic
                            ? "bg-brand-500 text-white border-brand-500 shadow-xs"
                            : "bg-muted/40 hover:bg-muted text-muted-foreground"
                        }`}
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        placeholder="e.g. Priyadharshini"
                        {...register("name")}
                        className="mt-1 text-xs rounded-xl"
                      />
                      {errors.name && (
                        <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="email">College Email / Personal Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@psnacet.edu.in"
                        {...register("email")}
                        className="mt-1 text-xs rounded-xl"
                      />
                      {errors.email && (
                        <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center">
                      <Label htmlFor="message">Message Details</Label>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {messageVal.length}/1000 chars
                      </span>
                    </div>
                    <Textarea
                      id="message"
                      rows={5}
                      placeholder="Share your inquiry, question, or proposal..."
                      {...register("message")}
                      className="mt-1 text-xs rounded-xl"
                    />
                    {errors.message && (
                      <p className="mt-1 text-xs text-destructive">{errors.message.message}</p>
                    )}
                  </div>

                  <Button type="submit" disabled={isSubmitting} className="w-full gap-2 rounded-xl font-bold">
                    {isSubmitting ? <Spinner className="text-white h-4 w-4" /> : <Send className="h-4 w-4" />}
                    Send Message
                  </Button>
                </form>
              </div>
            )}
          </motion.div>
        </div>

        {/* Frequently Asked Questions */}
        <div className="pt-8 border-t space-y-6 max-w-4xl mx-auto">
          <div className="text-center space-y-1">
            <h2 className="font-display text-2xl font-bold flex items-center justify-center gap-2">
              <HelpCircle className="h-6 w-6 text-brand-500" /> Frequently Asked Questions
            </h2>
            <p className="text-xs text-muted-foreground">
              Quick answers about joining UiZera, certifications, and coin rewards.
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-2">
            {FAQS.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border rounded-2xl px-5 bg-card/60">
                <AccordionTrigger className="text-left text-sm font-bold hover:no-underline py-4">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-xs text-muted-foreground leading-relaxed pb-4">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </div>
  );
}

