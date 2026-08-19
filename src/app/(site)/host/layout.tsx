"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Crown, Home } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { Spinner } from "@/components/shared/spinner";
import { cn } from "@/lib/utils";

export default function HostLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading, isHost } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!user || !isHost) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
          <Crown className="h-8 w-8" />
        </div>
        <h1 className="font-display text-2xl font-bold">Host Access Required</h1>
        <p className="text-muted-foreground max-w-sm">
          You need the <strong>Quiz Host</strong> role to access this area. Contact an admin to be assigned.
        </p>
        <Link href="/" className="text-sm text-brand-500 hover:underline">
          Go back home
        </Link>
      </div>
    );
  }



  return (
    <div className="flex min-h-[calc(100dvh-4rem)]">
      {/* Sidebar */}
      <aside className="hidden w-60 shrink-0 border-r bg-card/50 lg:block">
        <div className="sticky top-16 p-4">
          <div className="mb-1 flex items-center gap-2 px-3">
            <Crown className="h-5 w-5 text-amber-500" />
            <h2 className="font-display text-lg font-bold">
              Host <span className="text-gradient">Portal</span>
            </h2>
          </div>
          <p className="mb-6 px-3 text-xs text-muted-foreground">
            Your assigned live quiz sessions
          </p>
          <nav className="space-y-1">
            <Link
              href="/host"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                pathname === "/host"
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Home className="h-4 w-4" />
              My Quizzes
            </Link>
          </nav>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t bg-background/95 backdrop-blur-xl lg:hidden">
        <nav className="container flex items-center gap-1 py-2">
          <Link
            href="/host"
            className={cn(
              "flex shrink-0 flex-col items-center gap-0.5 rounded-lg p-2 text-[10px] font-medium transition-colors",
              pathname === "/host" ? "text-amber-500" : "text-muted-foreground"
            )}
          >
            <Home className="h-5 w-5" />
            My Quizzes
          </Link>
        </nav>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-x-hidden pb-20 lg:pb-0">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-6 lg:p-8"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
