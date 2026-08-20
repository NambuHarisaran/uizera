"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Award,
  Crown,
  Lock,
  ShieldCheck,
  Sparkles,
  Trophy,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";
import { Logo } from "@/components/layout/logo";
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
      toast.success("Welcome to UiZera Club!");
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
      className="glass-light w-full max-w-md rounded-3xl p-8 shadow-2xl sm:p-10 border border-border/60 relative overflow-hidden"
    >
      {/* Background subtle glow */}
      <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-brand-500/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
      </Link>

      <div className="mb-8 flex flex-col items-center text-center">
        <Logo
          width={190}
          height={64}
          className="mb-4"
          imgClassName="h-12 w-auto object-contain"
        />
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">
          Welcome to <span className="text-gradient">UiZera</span>
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
          The official UiPath Community at PSNA CET. Sign in with your Google account to join live quizzes, RPA challenges, and 30-day certification sprints.
        </p>
      </div>

      <div className="space-y-3">
        <Button
          onClick={handleSignIn}
          disabled={busy || loading}
          size="lg"
          className="w-full gap-3 h-12 rounded-2xl font-bold text-sm bg-card hover:bg-muted text-foreground border shadow-md hover:shadow-lg transition-all"
          variant="outline"
        >
          {busy ? (
            <Spinner className="text-brand-500 h-5 w-5" />
          ) : (
            <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>Continue with Google</span>
        </Button>

        {/* Security & Authentication Assurance Badge */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground pt-1">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          <span>Protected by Google OAuth 2.0 & Firebase Auth</span>
        </div>
      </div>

      {/* Community Benefits Showcase */}
      <div className="mt-8 space-y-2.5 rounded-2xl border bg-card/60 p-4 text-xs text-muted-foreground">
        <p className="flex items-center gap-2.5 font-medium text-foreground">
          <Trophy className="h-4 w-4 shrink-0 text-amber-500" />
          Live quizzes with instant coin rewards & XP
        </p>
        <p className="flex items-center gap-2.5 font-medium text-foreground">
          <Award className="h-4 w-4 shrink-0 text-violet-500" />
          30-Day Certification Sprint tracking
        </p>
        <p className="flex items-center gap-2.5 font-medium text-foreground">
          <Crown className="h-4 w-4 shrink-0 text-amber-500" />
          Level 40+ UiPath SDC Champion selection
        </p>
      </div>

      <p className="mt-6 text-center text-[11px] text-muted-foreground">
        By signing in, you agree to our{" "}
        <span className="font-semibold text-foreground">PSNA CET Community Guidelines</span>.
      </p>
    </motion.div>
  );
}

