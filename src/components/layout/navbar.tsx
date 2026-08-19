"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { ChevronDown, Coins, Crown, LayoutDashboard, LogOut, Menu, User, X } from "lucide-react";
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
import { cn, formatCoins, initials, rankStyleForLevel } from "@/lib/utils";
import { toast } from "sonner";

export function Navbar() {
  const pathname = usePathname();
  const { user, firebaseUser, loading, isAdmin, isHost, signInWithGoogle, signOut } = useAuth();
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
          <Image
            src="/uizera-logo.png"
            alt="UiZera Logo"
            width={120}
            height={40}
            className="h-9 w-auto object-contain"
            priority
          />
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          <Link
            href="/"
            className={cn(
              "rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors hover:text-foreground",
              pathname === "/" ? "text-foreground bg-accent/60" : "text-muted-foreground"
            )}
          >
            Home
          </Link>

          {/* Community Submenu */}
          <DropdownMenu>
            <DropdownMenuTrigger className={cn(
              "flex items-center gap-1 rounded-lg px-3.5 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground outline-none",
              ["/about", "/team", "/announcements", "/events", "/contact"].includes(pathname) && "text-foreground bg-accent/60"
            )}>
              Community <ChevronDown className="h-3.5 w-3.5 opacity-70" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem asChild>
                <Link href="/about">About UiZera</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/team">Team & Leadership</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/announcements">Announcements</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/events">Events & Workshops</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/contact">Contact Us</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Activities & Ranks Submenu */}
          <DropdownMenu>
            <DropdownMenuTrigger className={cn(
              "flex items-center gap-1 rounded-lg px-3.5 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground outline-none",
              ["/quiz", "/challenges", "/certifications", "/achievements", "/champions", "/leaderboard", "/resources"].includes(pathname) && "text-foreground bg-accent/60"
            )}>
              Activities & Ranks <ChevronDown className="h-3.5 w-3.5 opacity-70" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem asChild>
                <Link href="/quiz" className="flex items-center justify-between">
                  <span>Quizzes</span>
                  <span className="text-[10px] bg-uipath-orange/15 text-uipath-orange font-bold px-1.5 py-0.5 rounded">PLAY</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/challenges" className="flex items-center justify-between">
                  <span>Weekly Challenges</span>
                  <span className="text-[10px] bg-brand-500/15 text-brand-500 font-bold px-1.5 py-0.5 rounded">NEW</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/certifications">30-Day Certifications</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/achievements">Achievements & Level</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/champions" className="flex items-center justify-between font-bold text-amber-500">
                  <span>Champions Selection</span>
                  <Crown className="h-3.5 w-3.5 text-amber-500" />
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/leaderboard">Leaderboard</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/resources">Learning Resources</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
                <DropdownMenuTrigger
                  aria-label="Open user menu"
                  className="rounded-full outline-none ring-brand-500 focus-visible:ring-2"
                >
                  <Avatar className="h-8 w-8 sm:h-9 sm:w-9 border-2 border-brand-500/40">
                    <AvatarImage src={user.photoURL ?? undefined} alt={user.displayName || "User"} />
                    <AvatarFallback>{initials(user.displayName)}</AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="flex flex-col">
                    <span className="truncate" title={user.displayName || "User"}>{user.displayName || "User"}</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      Level {user.level ?? 1} · <span className="font-semibold text-foreground">{rankStyleForLevel(user.level ?? 1).title}</span>
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
                      Achievements & Level
                    </Link>
                  </DropdownMenuItem>
                  {isHost && (
                    <DropdownMenuItem asChild>
                      <Link href="/host">
                        <Crown className="text-amber-500" /> Host portal
                      </Link>
                    </DropdownMenuItem>
                  )}
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
                <div className="mb-2 flex items-center justify-between gap-2 rounded-xl border bg-card/60 p-3 text-xs">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-foreground" title={user.displayName}>
                      {user.displayName}
                    </p>
                    <p className="truncate text-muted-foreground">Level {user.level} ({rankStyleForLevel(user.level).title}) · {formatCoins(user.xp)} XP</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 font-bold text-amber-500">
                    <Coins className="h-4 w-4" /> {formatCoins(user.coins)}
                  </div>
                </div>
              )}

              <div className="space-y-3 max-h-[75vh] overflow-y-auto pr-1">
                <Link
                  href="/"
                  className={cn(
                    "block rounded-lg px-3 py-2 text-sm font-bold transition-colors hover:bg-accent",
                    pathname === "/" ? "bg-accent text-foreground" : "text-muted-foreground"
                  )}
                >
                  Home
                </Link>

                <div className="space-y-1">
                  <p className="px-3 text-[11px] font-mono font-bold uppercase tracking-wider text-muted-foreground/70">
                    Community
                  </p>
                  {[
                    { href: "/about", label: "About UiZera" },
                    { href: "/team", label: "Team & Leadership" },
                    { href: "/announcements", label: "Announcements" },
                    { href: "/events", label: "Events & Workshops" },
                    { href: "/contact", label: "Contact Us" },
                  ].map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "block rounded-lg px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-foreground",
                        pathname === item.href ? "bg-accent font-bold text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>

                <div className="space-y-1 pt-1 border-t">
                  <p className="px-3 text-[11px] font-mono font-bold uppercase tracking-wider text-muted-foreground/70">
                    Activities & Ranks
                  </p>
                  <Link
                    href="/quiz"
                    className="flex items-center justify-between rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    <span>Quizzes</span>
                    <span className="text-[10px] bg-uipath-orange/15 text-uipath-orange font-bold px-1.5 py-0.5 rounded">PLAY</span>
                  </Link>
                  <Link
                    href="/challenges"
                    className="flex items-center justify-between rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    <span>Weekly Challenges</span>
                    <span className="text-[10px] bg-brand-500/15 text-brand-500 font-bold px-1.5 py-0.5 rounded">NEW</span>
                  </Link>
                  <Link
                    href="/certifications"
                    className="block rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    30-Day Certifications
                  </Link>
                  <Link
                    href="/achievements"
                    className="block rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    Achievements & Level
                  </Link>
                  <Link
                    href="/champions"
                    className="flex items-center justify-between rounded-lg px-3 py-1.5 text-sm font-bold text-amber-500 hover:bg-accent"
                  >
                    <span>Champions Selection</span>
                    <Crown className="h-3.5 w-3.5 text-amber-500" />
                  </Link>
                  <Link
                    href="/leaderboard"
                    className="block rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    Leaderboard
                  </Link>
                  <Link
                    href="/resources"
                    className="block rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    Learning Resources
                  </Link>
                  {isHost && (
                    <Link
                      href="/host"
                      className="block rounded-lg px-3 py-1.5 text-sm font-bold text-amber-500 hover:bg-accent mt-1"
                    >
                      Host Portal
                    </Link>
                  )}
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="block rounded-lg px-3 py-1.5 text-sm font-bold text-uipath-orange hover:bg-accent mt-1"
                    >
                      Admin Dashboard
                    </Link>
                  )}
                </div>
              </div>

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
