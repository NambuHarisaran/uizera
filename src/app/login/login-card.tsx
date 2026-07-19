"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Bot, ShieldCheck, Sparkles, Trophy } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/shared/spinner";
import { SITE } from "@/lib/constants";

/** Only allow internal redirect targets — never an absolute/external URL. */
function safeNext(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/profile";
  return raw;
}

export function LoginCard() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, loading, signInWithGoogle } = useAuth();
  const [busy, setBusy] = useState(false);

  const next = safeNext(params.get("next"));

  useEffect(() => {
    if (!loading && user) router.replace(next);
  }, [user, loading, router, next]);

  const handleSignIn = async () => {
    setBusy(true);
    try {
      await signInWithGoogle();
      toast.success("Welcome to UI Zera!");
      router.replace(next);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign-in failed.");
      setBusy(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="glass-light w-full max-w-md rounded-3xl p-8 shadow-2xl sm:p-10"
    >
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to home
      </Link>

      <div className="mb-8 flex flex-col items-center text-center">
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-uipath-orange text-white shadow-xl shadow-brand-500/30">
          <Bot className="h-7 w-7" />
        </span>
        <h1 className="font-display text-2xl font-bold">
          Welcome to UI <span className="text-gradient">Zera</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {SITE.tagline}. Sign in with your Google account to join quizzes,
          challenges, and the 30-day certification sprint.
        </p>
      </div>

      <Button
        onClick={handleSignIn}
        disabled={busy || loading}
        size="lg"
        className="w-full"
      >
        {busy ? (
          <Spinner className="text-white" />
        ) : (
          <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="currentColor"
              d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81"
            />
          </svg>
        )}
        Continue with Google
      </Button>

      <div className="mt-8 space-y-3 text-sm text-muted-foreground">
        <p className="flex items-center gap-2.5">
          <Trophy className="h-4 w-4 shrink-0 text-brand-500" />
          Earn coins from quizzes and weekly challenges
        </p>
        <p className="flex items-center gap-2.5">
          <Sparkles className="h-4 w-4 shrink-0 text-brand-500" />
          Track your 30-day certification streak
        </p>
        <p className="flex items-center gap-2.5">
          <ShieldCheck className="h-4 w-4 shrink-0 text-brand-500" />
          Secured with Google sign-in — no passwords stored
        </p>
      </div>
    </motion.div>
  );
}
