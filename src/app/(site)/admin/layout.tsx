"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Award,
  BarChart3,
  Coins,
  FileText,
  LayoutDashboard,
  Megaphone,
  Settings,
  Target,
  Users,
  Zap,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { Spinner } from "@/components/shared/spinner";
import { cn } from "@/lib/utils";

const sidebarLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/quizzes", label: "Quizzes", icon: Zap },
  { href: "/admin/challenges", label: "Challenges", icon: Target },
  { href: "/admin/certifications", label: "Certifications", icon: Award },
  { href: "/admin/coins", label: "Award Coins", icon: Coins },
  { href: "/admin/content", label: "Content", icon: FileText },
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <BarChart3 className="h-12 w-12 text-muted-foreground/30" />
        <h1 className="font-display text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">
          You need admin privileges to access this area.
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
      <aside className="hidden w-64 shrink-0 border-r bg-card/50 lg:block">
        <div className="sticky top-16 p-4">
          <h2 className="mb-1 px-3 font-display text-lg font-bold">
            Admin <span className="text-gradient">Panel</span>
          </h2>
          <p className="mb-6 px-3 text-xs text-muted-foreground">
            Manage the UiZera platform
          </p>
          <nav className="space-y-1">
            {sidebarLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                pathname === link.href ||
                (link.href !== "/admin" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isActive
                      ? "bg-brand-500/10 text-brand-600 dark:text-brand-400"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Mobile nav — horizontally scrollable so all sections stay reachable
          instead of permanently hiding the tail end of the list. */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t bg-background/95 backdrop-blur-xl lg:hidden">
        <nav className="container flex items-center gap-1 overflow-x-auto py-2">
          {sidebarLinks.map((link) => {
            const Icon = link.icon;
            const isActive =
              pathname === link.href ||
              (link.href !== "/admin" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex shrink-0 flex-col items-center gap-0.5 rounded-lg p-2 text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isActive
                    ? "text-brand-500"
                    : "text-muted-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                {link.label}
              </Link>
            );
          })}
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
