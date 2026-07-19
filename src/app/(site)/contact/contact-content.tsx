"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Instagram, Linkedin, Mail, MapPin, MessageCircle, Send, Twitter } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/shared/spinner";
import { contactSchema } from "@/lib/validation";
import { SITE } from "@/lib/constants";
import type { z } from "zod";

type FormData = z.infer<typeof contactSchema>;

const contactInfo = [
  { icon: Mail, label: "Email", value: SITE.email, href: `mailto:${SITE.email}` },
  { icon: MapPin, label: "Location", value: `${SITE.college}, ${SITE.location}`, href: null },
];

const socials = [
  { icon: Instagram, label: "Instagram", href: SITE.social.instagram },
  { icon: Linkedin, label: "LinkedIn", href: SITE.social.linkedin },
  { icon: Twitter, label: "X (Twitter)", href: SITE.social.twitter },
];

export function ContactContent() {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error((body as { error?: string })?.error ?? "Failed to send message.");
      }
      setSubmitted(true);
      reset();
      toast.success("Message sent! We'll get back to you soon.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  return (
    <div className="pb-24">
      {/* Hero */}
      <section className="hero-glow relative overflow-hidden py-24">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-20" />
        <div className="container relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl text-center"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-sm font-medium text-brand-600 dark:text-brand-400">
              <MessageCircle className="h-4 w-4" />
              Contact Us
            </div>
            <h1 className="font-display text-4xl font-bold sm:text-5xl">
              Get in <span className="text-gradient">Touch</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Have a question, suggestion, or want to collaborate? We&apos;d love to hear from you.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="container py-16">
        <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-5">
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-2"
          >
            <h2 className="mb-6 font-display text-2xl font-bold">Contact Info</h2>
            <div className="space-y-5">
              {contactInfo.map((c) => {
                const Icon = c.icon;
                const content = (
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-brand-500">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{c.label}</p>
                      <p className="text-sm text-muted-foreground">{c.value}</p>
                    </div>
                  </div>
                );
                return c.href ? (
                  <a key={c.label} href={c.href} className="block transition-colors hover:text-brand-500">
                    {content}
                  </a>
                ) : (
                  <div key={c.label}>{content}</div>
                );
              })}
            </div>

            <h3 className="mb-4 mt-10 font-display text-lg font-semibold">Follow Us</h3>
            <div className="flex gap-3">
              {socials.map((s) => {
                const Icon = s.icon;
                return (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border text-muted-foreground transition-all hover:border-brand-500/50 hover:text-brand-500"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>
          </motion.div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-3"
          >
            {submitted ? (
              <div className="flex flex-col items-center rounded-2xl border bg-card p-12 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
                  <Send className="h-7 w-7" />
                </div>
                <h3 className="font-display text-xl font-bold">Message Sent!</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Thank you for reaching out. We&apos;ll get back to you as soon as possible.
                </p>
                <Button onClick={() => setSubmitted(false)} variant="outline" className="mt-6">
                  Send Another Message
                </Button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-5 rounded-2xl border bg-card p-8"
              >
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="Your full name"
                    {...register("name")}
                    className="mt-1.5"
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    {...register("email")}
                    className="mt-1.5"
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    rows={5}
                    placeholder="Your message..."
                    {...register("message")}
                    className="mt-1.5"
                  />
                  {errors.message && (
                    <p className="mt-1 text-xs text-destructive">{errors.message.message}</p>
                  )}
                </div>
                <Button type="submit" disabled={isSubmitting} className="w-full gap-2">
                  {isSubmitting ? <Spinner className="text-white" /> : <Send className="h-4 w-4" />}
                  Send Message
                </Button>
              </form>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
