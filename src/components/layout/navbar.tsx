"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";
import { Logo } from "@/components/layout/logo";
import {
  Award,
  BookOpen,
  Calendar,
  ChevronDown,
  Coins,
  Crown,
  Gamepad2,
  Info,
  LayoutDashboard,
  LogOut,
  Mail,
  Medal,
  Megaphone,
  Menu,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  User,
  Users,
  X,
} from "lucide-react";
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
import {
  cn,
  formatCoins,
  initials,
  levelProgress,
  rankStyleForLevel,
} from "@/lib/utils";
import { toast } from "sonner";

export function Navbar() {
  const pathname = usePathname();
  const { user, firebaseUser, loading, isAdmin, isHost, signInWithGoogle, signOut } =
    useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Reading / Scroll Progress Bar
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 25,
    restDelta: 0.001,
  });

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

  const isCommunityActive = [
    "/about",
    "/team",
    "/announcements",
    "/events",
    "/gallery",
    "/contact",
  ].some((route) => pathname === route || pathname.startsWith(route + "/"));

  const isActivitiesActive = [
    "/quiz",
    "/challenges",
    "/certifications",
    "/achievements",
    "/champions",
    "/leaderboard",
    "/resources",
  ].some((route) => pathname === route || pathname.startsWith(route + "/"));

  const userLevel = user?.level ?? 1;
  const rankStyle = rankStyleForLevel(userLevel);
  const xpProgress = user ? Math.round(levelProgress(user.xp ?? 0) * 100) : 0;

  return (
    <>
      {/* Subtle Reading / Scroll Progress Bar at the very top */}
      <motion.div
        style={{ scaleX }}
        className="fixed inset-x-0 top-0 z-50 h-[2.5px] origin-left bg-gradient-to-r from-uipath-orange via-amber-500 to-brand-500 pointer-events-none shadow-[0_0_8px_rgba(250,70,22,0.4)]"
      />

      <header
        className={cn(
          "fixed inset-x-0 top-0 z-40 transition-all duration-300",
          scrolled
            ? "border-b border-border/60 bg-background/85 backdrop-blur-xl shadow-sm"
            : "bg-transparent border-b border-transparent"
        )}
      >
        <nav className="container flex h-16 items-center justify-between gap-4">
          {/* Logo with micro hover scale */}
          <Link
            href="/"
            className="flex items-center gap-2.5 font-display text-lg font-bold group"
          >
            <Logo
              width={140}
              height={46}
              priority
              imgClassName="h-9 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
            />
          </Link>

          {/* Desktop Navigation Links & Dropdowns */}
          <div className="hidden items-center gap-1.5 lg:flex">
            {/* Home Link */}
            <Link
              href="/"
              className={cn(
                "relative rounded-xl px-3.5 py-2 text-sm font-semibold transition-all duration-200",
                pathname === "/"
                  ? "bg-accent/80 text-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
              )}
            >
              Home
              {pathname === "/" && (
                <motion.span
                  layoutId="nav-active-dot"
                  className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-uipath-orange"
                />
              )}
            </Link>

            {/* Community Submenu */}
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  "flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold transition-all duration-200 outline-none",
                  isCommunityActive
                    ? "bg-accent/80 text-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
                )}
              >
                <span>Community</span>
                <ChevronDown className="h-3.5 w-3.5 opacity-70 transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-52 p-1.5 rounded-2xl border border-border/70 bg-background/95 backdrop-blur-xl shadow-xl animate-in fade-in-0 zoom-in-95"
              >
                <DropdownMenuItem asChild>
                  <Link
                    href="/about"
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium cursor-pointer transition-colors"
                  >
                    <Info className="h-4 w-4 text-brand-500" />
                    <span>About UiZera</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/team"
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium cursor-pointer transition-colors"
                  >
                    <Users className="h-4 w-4 text-brand-500" />
                    <span>Team & Leadership</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/announcements"
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium cursor-pointer transition-colors"
                  >
                    <Megaphone className="h-4 w-4 text-uipath-orange" />
                    <span>Announcements</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/events"
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium cursor-pointer transition-colors"
                  >
                    <Calendar className="h-4 w-4 text-emerald-500" />
                    <span>Events & Workshops</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/gallery"
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium cursor-pointer transition-colors"
                  >
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    <span>Photo Gallery</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem asChild>
                  <Link
                    href="/contact"
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium cursor-pointer transition-colors"
                  >
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>Contact Us</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Activities & Ranks Submenu */}
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  "flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold transition-all duration-200 outline-none",
                  isActivitiesActive
                    ? "bg-accent/80 text-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
                )}
              >
                <span>Activities & Ranks</span>
                <ChevronDown className="h-3.5 w-3.5 opacity-70 transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-60 p-1.5 rounded-2xl border border-border/70 bg-background/95 backdrop-blur-xl shadow-xl animate-in fade-in-0 zoom-in-95"
              >
                <DropdownMenuItem asChild>
                  <Link
                    href="/quiz"
                    className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Gamepad2 className="h-4 w-4 text-uipath-orange" />
                      <span>Quizzes</span>
                    </div>
                    <span className="text-[10px] bg-uipath-orange/15 text-uipath-orange font-bold px-1.5 py-0.5 rounded shadow-sm">
                      PLAY
                    </span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/challenges"
                    className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Target className="h-4 w-4 text-brand-500" />
                      <span>Weekly Challenges</span>
                    </div>
                    <span className="text-[10px] bg-brand-500/15 text-brand-500 font-bold px-1.5 py-0.5 rounded shadow-sm">
                      NEW
                    </span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/certifications"
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium cursor-pointer transition-colors"
                  >
                    <ShieldCheck className="h-4 w-4 text-blue-500" />
                    <span>30-Day Certifications</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem asChild>
                  <Link
                    href="/achievements"
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium cursor-pointer transition-colors"
                  >
                    <Medal className="h-4 w-4 text-amber-500" />
                    <span>Achievements & Level</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/champions"
                    className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-bold text-amber-500 hover:text-amber-600 dark:hover:text-amber-400 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Crown className="h-4 w-4 text-amber-500" />
                      <span>Champions Selection</span>
                    </div>
                    <span className="text-[10px] bg-amber-500/15 text-amber-500 font-extrabold px-1.5 py-0.5 rounded border border-amber-500/30">
                      ELITE
                    </span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/leaderboard"
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium cursor-pointer transition-colors"
                  >
                    <Trophy className="h-4 w-4 text-amber-500" />
                    <span>Leaderboard</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/resources"
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium cursor-pointer transition-colors"
                  >
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span>Learning Resources</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Right Action Items */}
          <div className="flex items-center gap-2.5">
            <ThemeToggle />

            {/* Unauthenticated Join CTA */}
            {!loading && !firebaseUser && (
              <Button
                onClick={handleSignIn}
                size="sm"
                className="btn-primary rounded-xl px-3.5 sm:px-5 font-bold shadow-md text-xs sm:text-sm cursor-pointer"
              >
                Join with Google
              </Button>
            )}

            {/* Authenticated User Status & Dropdown */}
            {user && (
              <>
                {/* Coins Chip with glowing hover */}
                <Link
                  href="/profile"
                  title="Your Coins Balance"
                  className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-600 dark:text-amber-400 transition-all hover:bg-amber-500/20 hover:border-amber-500/50 sm:px-3 sm:py-1.5 sm:text-sm"
                >
                  <Coins className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-500 animate-pulse" />
                  <span>{formatCoins(user.coins ?? 0)}</span>
                </Link>

                {/* User Avatar Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger
                    aria-label="Open user menu"
                    className="group relative rounded-full outline-none ring-brand-500/50 focus-visible:ring-2 cursor-pointer"
                  >
                    <Avatar className="h-8 w-8 sm:h-9 sm:w-9 border-2 border-brand-500/40 transition-transform duration-200 group-hover:scale-105 group-hover:border-brand-500">
                      <AvatarImage
                        src={user.photoURL ?? undefined}
                        alt={user.displayName || "User"}
                      />
                      <AvatarFallback className="font-bold text-xs">
                        {initials(user.displayName)}
                      </AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent
                    align="end"
                    className="w-64 p-2 rounded-2xl border border-border/70 bg-background/95 backdrop-blur-xl shadow-2xl animate-in fade-in-0 zoom-in-95"
                  >
                    {/* User Rich Profile Header */}
                    <DropdownMenuLabel className="p-2 font-normal">
                      <div className="flex items-center gap-3 mb-2.5">
                        <Avatar className="h-10 w-10 border-2 border-brand-500/40">
                          <AvatarImage
                            src={user.photoURL ?? undefined}
                            alt={user.displayName || "User"}
                          />
                          <AvatarFallback className="font-bold">
                            {initials(user.displayName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0">
                          <span
                            className="truncate text-sm font-bold text-foreground"
                            title={user.displayName || "User"}
                          >
                            {user.displayName || "User"}
                          </span>
                          <span
                            className="truncate text-[11px] text-muted-foreground"
                            title={user.email || undefined}
                          >
                            {user.email || "UiZera Member"}
                          </span>
                        </div>
                      </div>

                      {/* Rank & Level Badge */}
                      <div className="flex items-center justify-between rounded-xl bg-accent/50 p-2 text-xs mb-2">
                        <span className="text-muted-foreground font-medium">
                          Rank & Level
                        </span>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold",
                            rankStyle.badgeClass
                          )}
                        >
                          Lvl {userLevel} · {rankStyle.title}
                        </span>
                      </div>

                      {/* XP Progress Bar */}
                      <div className="space-y-1 px-0.5 mb-1">
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span>XP Progress</span>
                          <span className="font-semibold text-foreground">
                            {formatCoins(user.xp ?? 0)} XP
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-brand-500 to-uipath-orange transition-all duration-500"
                            style={{ width: `${xpProgress}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-right text-muted-foreground/80">
                          {xpProgress}% to Level {userLevel + 1}
                        </p>
                      </div>
                    </DropdownMenuLabel>

                    <DropdownMenuSeparator className="my-1" />

                    <DropdownMenuItem asChild>
                      <Link
                        href="/profile"
                        className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-medium cursor-pointer transition-colors"
                      >
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>My Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/achievements"
                        className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-medium cursor-pointer transition-colors"
                      >
                        <Award className="h-4 w-4 text-amber-500" />
                        <span>Achievements & Badges</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/leaderboard"
                        className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-medium cursor-pointer transition-colors"
                      >
                        <Trophy className="h-4 w-4 text-amber-500" />
                        <span>Global Leaderboard</span>
                      </Link>
                    </DropdownMenuItem>

                    {isHost && (
                      <DropdownMenuItem asChild>
                        <Link
                          href="/host"
                          className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-semibold text-amber-500 hover:text-amber-600 dark:hover:text-amber-400 cursor-pointer transition-colors"
                        >
                          <Crown className="h-4 w-4 text-amber-500" />
                          <span>Host Portal</span>
                        </Link>
                      </DropdownMenuItem>
                    )}

                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link
                          href="/admin"
                          className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-semibold text-uipath-orange hover:text-uipath-orange/80 cursor-pointer transition-colors"
                        >
                          <LayoutDashboard className="h-4 w-4 text-uipath-orange" />
                          <span>Admin Dashboard</span>
                        </Link>
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator className="my-1" />

                    <DropdownMenuItem
                      onClick={() => void signOut()}
                      className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-medium text-destructive hover:text-destructive hover:bg-destructive/10 focus:text-destructive focus:bg-destructive/10 cursor-pointer transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}

            {/* Mobile Menu Toggle Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-9 w-9 rounded-xl border border-border/50 bg-background/50 backdrop-blur-sm cursor-pointer"
              aria-label="Toggle mobile menu"
              onClick={() => setMobileOpen((o) => !o)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </nav>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="overflow-hidden border-b border-border/70 bg-background/95 backdrop-blur-2xl shadow-2xl lg:hidden"
            >
              <div className="container flex flex-col gap-2 py-4 max-h-[calc(100vh-4.5rem)] overflow-y-auto">
                {/* User Profile Card in Mobile Drawer */}
                {user && (
                  <div className="mb-2 rounded-2xl border border-border/80 bg-card/70 p-3.5 shadow-sm space-y-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar className="h-9 w-9 border-2 border-brand-500/40 shrink-0">
                          <AvatarImage
                            src={user.photoURL ?? undefined}
                            alt={user.displayName || "User"}
                          />
                          <AvatarFallback className="font-bold text-xs">
                            {initials(user.displayName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p
                            className="truncate font-bold text-sm text-foreground"
                            title={user.displayName || "User"}
                          >
                            {user.displayName}
                          </p>
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full border px-2 py-0.2 text-[10px] font-bold mt-0.5",
                              rankStyle.badgeClass
                            )}
                          >
                            Lvl {userLevel} · {rankStyle.title}
                          </span>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-500">
                        <Coins className="h-3.5 w-3.5" />
                        <span>{formatCoins(user.coins ?? 0)}</span>
                      </div>
                    </div>

                    {/* XP Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>XP Progress</span>
                        <span className="font-semibold text-foreground">
                          {formatCoins(user.xp ?? 0)} XP ({xpProgress}%)
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-brand-500 to-uipath-orange transition-all duration-500"
                          style={{ width: `${xpProgress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Section 1: Overview */}
                <div className="space-y-1">
                  <Link
                    href="/"
                    className={cn(
                      "flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-bold transition-all",
                      pathname === "/"
                        ? "bg-accent text-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                    )}
                  >
                    <span>Home</span>
                    {pathname === "/" && (
                      <span className="h-1.5 w-1.5 rounded-full bg-uipath-orange" />
                    )}
                  </Link>
                </div>

                {/* Section 2: Activities & Ranks */}
                <div className="space-y-1 pt-2 border-t border-border/50">
                  <p className="px-3 text-[11px] font-mono font-bold uppercase tracking-wider text-muted-foreground/70">
                    Activities & Ranks
                  </p>
                  <Link
                    href="/quiz"
                    className={cn(
                      "flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                      pathname.startsWith("/quiz")
                        ? "bg-accent font-bold text-foreground"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Gamepad2 className="h-4 w-4 text-uipath-orange" />
                      <span>Quizzes</span>
                    </div>
                    <span className="text-[10px] bg-uipath-orange/15 text-uipath-orange font-bold px-1.5 py-0.5 rounded">
                      PLAY
                    </span>
                  </Link>

                  <Link
                    href="/challenges"
                    className={cn(
                      "flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                      pathname.startsWith("/challenges")
                        ? "bg-accent font-bold text-foreground"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Target className="h-4 w-4 text-brand-500" />
                      <span>Weekly Challenges</span>
                    </div>
                    <span className="text-[10px] bg-brand-500/15 text-brand-500 font-bold px-1.5 py-0.5 rounded">
                      NEW
                    </span>
                  </Link>

                  <Link
                    href="/certifications"
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                      pathname.startsWith("/certifications")
                        ? "bg-accent font-bold text-foreground"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                    )}
                  >
                    <ShieldCheck className="h-4 w-4 text-blue-500" />
                    <span>30-Day Certifications</span>
                  </Link>

                  <Link
                    href="/achievements"
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                      pathname.startsWith("/achievements")
                        ? "bg-accent font-bold text-foreground"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                    )}
                  >
                    <Medal className="h-4 w-4 text-amber-500" />
                    <span>Achievements & Level</span>
                  </Link>

                  <Link
                    href="/champions"
                    className={cn(
                      "flex items-center justify-between rounded-xl px-3 py-2 text-sm font-bold transition-colors",
                      pathname.startsWith("/champions")
                        ? "bg-accent text-amber-500"
                        : "text-amber-500 hover:bg-accent/50"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Crown className="h-4 w-4 text-amber-500" />
                      <span>Champions Selection</span>
                    </div>
                    <span className="text-[10px] bg-amber-500/15 text-amber-500 font-extrabold px-1.5 py-0.5 rounded border border-amber-500/30">
                      ELITE
                    </span>
                  </Link>

                  <Link
                    href="/leaderboard"
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                      pathname.startsWith("/leaderboard")
                        ? "bg-accent font-bold text-foreground"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                    )}
                  >
                    <Trophy className="h-4 w-4 text-amber-500" />
                    <span>Leaderboard</span>
                  </Link>

                  <Link
                    href="/resources"
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                      pathname.startsWith("/resources")
                        ? "bg-accent font-bold text-foreground"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                    )}
                  >
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span>Learning Resources</span>
                  </Link>
                </div>

                {/* Section 3: Community */}
                <div className="space-y-1 pt-2 border-t border-border/50">
                  <p className="px-3 text-[11px] font-mono font-bold uppercase tracking-wider text-muted-foreground/70">
                    Community
                  </p>
                  {[
                    { href: "/about", label: "About UiZera", icon: Info },
                    { href: "/team", label: "Team & Leadership", icon: Users },
                    { href: "/announcements", label: "Announcements", icon: Megaphone },
                    { href: "/events", label: "Events & Workshops", icon: Calendar },
                    { href: "/gallery", label: "Photo Gallery", icon: Sparkles },
                    { href: "/contact", label: "Contact Us", icon: Mail },
                  ].map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      pathname === item.href ||
                      pathname.startsWith(item.href + "/");
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-accent font-bold text-foreground"
                            : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                        )}
                      >
                        <Icon className="h-4 w-4 opacity-70" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>

                {/* Section 4: Host & Admin Portals */}
                {(isHost || isAdmin) && (
                  <div className="space-y-1 pt-2 border-t border-border/50">
                    <p className="px-3 text-[11px] font-mono font-bold uppercase tracking-wider text-muted-foreground/70">
                      Staff Portals
                    </p>
                    {isHost && (
                      <Link
                        href="/host"
                        className={cn(
                          "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-bold text-amber-500 transition-colors",
                          pathname.startsWith("/host")
                            ? "bg-accent"
                            : "hover:bg-accent/50"
                        )}
                      >
                        <Crown className="h-4 w-4 text-amber-500" />
                        <span>Host Portal</span>
                      </Link>
                    )}
                    {isAdmin && (
                      <Link
                        href="/admin"
                        className={cn(
                          "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-bold text-uipath-orange transition-colors",
                          pathname.startsWith("/admin")
                            ? "bg-accent"
                            : "hover:bg-accent/50"
                        )}
                      >
                        <LayoutDashboard className="h-4 w-4 text-uipath-orange" />
                        <span>Admin Dashboard</span>
                      </Link>
                    )}
                  </div>
                )}

                {/* Unauthenticated Join CTA or Sign Out Button */}
                {!firebaseUser && !loading && (
                  <Button
                    onClick={handleSignIn}
                    className="btn-primary mt-3 w-full rounded-xl py-2.5 font-bold shadow-md cursor-pointer"
                  >
                    Join with Google
                  </Button>
                )}

                {user && (
                  <div className="pt-2 border-t border-border/50 mt-1 flex items-center justify-between">
                    <Link
                      href="/profile"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
                    >
                      <User className="h-3.5 w-3.5" />
                      <span>My Profile</span>
                    </Link>
                    <button
                      onClick={() => void signOut()}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-destructive hover:opacity-80 cursor-pointer"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Sign out</span>
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}

