"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Coins, LayoutDashboard, LogOut, Menu, User, X } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NAV_LINKS, SITE } from "@/lib/constants";
import { cn, formatCoins, initials } from "@/lib/utils";
import { toast } from "sonner";

export function Navbar() {
  const pathname = usePathname();
  const { user, firebaseUser, loading, isAdmin, signInWithGoogle, signOut } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setMobileOpen(false), [pathname]);

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
      toast.success("Welcome to UiZera!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign-in failed.");
    }
  };

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 transition-all duration-300",
        scrolled
          ? "border-b border-border/60 bg-background/80 backdrop-blur-xl"
          : "bg-transparent"
      )}
    >
      <nav className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 font-display text-lg font-bold">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-uipath-orange text-white shadow-lg shadow-brand-500/30 transition-transform duration-300 hover:rotate-6">
            <Bot className="h-5 w-5" />
          </span>
          <span>
            UI <span className="text-gradient">Zera</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                pathname === link.href && "text-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          {!loading && !firebaseUser && (
            <Button onClick={handleSignIn} size="sm" className="btn-primary rounded-xl px-3 sm:px-5 font-bold shadow-md text-xs sm:text-sm">
              Join with Google
            </Button>
          )}

          {user && (
            <>
              <div className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400 sm:px-3 sm:py-1.5 sm:text-sm">
                <Coins className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-500" />
                {formatCoins(user.coins)}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger className="rounded-full outline-none ring-brand-500 focus-visible:ring-2">
                  <Avatar className="h-8 w-8 sm:h-9 sm:w-9 border-2 border-brand-500/40">
                    <AvatarImage src={user.photoURL ?? undefined} alt={user.displayName} />
                    <AvatarFallback>{initials(user.displayName)}</AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="flex flex-col">
                    <span>{user.displayName}</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      Level {user.level} · {formatCoins(user.coins)} coins
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <User /> Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/achievements">
                      <Bot /> Achievements & Level
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin">
                        <LayoutDashboard /> Admin dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => void signOut()}>
                    <LogOut /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Toggle menu"
            onClick={() => setMobileOpen((o) => !o)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-b border-border/60 bg-background/95 backdrop-blur-xl lg:hidden"
          >
            <div className="container flex flex-col gap-1 py-4">
              {user && (
                <div className="mb-2 rounded-xl border bg-card/60 p-3 text-xs flex items-center justify-between">
                  <div>
                    <p className="font-bold text-foreground">{user.displayName}</p>
                    <p className="text-muted-foreground">Level {user.level} (Max 50) · {formatCoins(user.xp)} XP</p>
                  </div>
                  <div className="flex items-center gap-1 font-bold text-amber-500">
                    <Coins className="h-4 w-4" /> {formatCoins(user.coins)}
                  </div>
                </div>
              )}

              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                    pathname === link.href && "bg-accent text-foreground font-bold"
                  )}
                >
                  {link.label}
                </Link>
              ))}

              {user && (
                <div className="mt-2 pt-2 border-t space-y-1">
                  <Link
                    href="/quiz"
                    className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    <span>Quizzes</span>
                    <span className="text-xs bg-uipath-orange/10 text-uipath-orange px-2 py-0.5 rounded-full font-bold">Play</span>
                  </Link>
                  <Link
                    href="/challenges"
                    className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    <span>Weekly Challenges</span>
                    <span className="text-xs bg-brand-500/10 text-brand-500 px-2 py-0.5 rounded-full font-bold">New</span>
                  </Link>
                  <Link
                    href="/certifications"
                    className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    <span>30-Day Certifications</span>
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-bold text-uipath-orange hover:bg-accent"
                    >
                      <span>Admin Dashboard</span>
                    </Link>
                  )}
                </div>
              )}

              {!firebaseUser && !loading && (
                <Button onClick={handleSignIn} className="mt-3 w-full font-bold">
                  Join with Google
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
