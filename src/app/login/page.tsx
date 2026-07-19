import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSpinner } from "@/components/shared/spinner";
import { LoginCard } from "./login-card";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to the UiZera Club community platform with Google.",
};

export default function LoginPage() {
  return (
    <main className="hero-glow relative flex min-h-dvh items-center justify-center overflow-hidden px-4">
      <div className="bg-grid absolute inset-0 -z-10 opacity-40" />
      <Suspense fallback={<PageSpinner />}>
        <LoginCard />
      </Suspense>
    </main>
  );
}
