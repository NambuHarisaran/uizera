import Link from "next/link";
import { Bot } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="hero-glow flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <span className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-amber-500 text-white shadow-xl shadow-brand-500/30">
        <Bot className="h-8 w-8" />
      </span>
      <h1 className="font-display text-6xl font-bold text-gradient">404</h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        This automation ran off the happy path. The page you are looking for does
        not exist or has been moved.
      </p>
      <Button asChild className="mt-8">
        <Link href="/">Back to home</Link>
      </Button>
    </main>
  );
}
