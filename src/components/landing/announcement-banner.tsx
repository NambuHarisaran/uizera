"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Bell, Megaphone, ArrowRight, X, Sparkles } from "lucide-react";
import { useAnnouncements } from "@/lib/hooks";

export function AnnouncementBanner() {
  const { data } = useAnnouncements();
  const [dismissed, setDismissed] = useState(false);

  const items = data?.items ?? [];
  const activeAnnouncement =
    items.find((i) => i.pinned || i.priority === "urgent" || i.priority === "important") ||
    items[0];

  if (dismissed || !activeAnnouncement) return null;

  const priorityConfig = {
    urgent: {
      wrapper: "bg-red-500/10 dark:bg-red-950/30 border-red-500/30 shadow-[0_0_24px_-4px_rgba(239,68,68,0.25)]",
      badge: "bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30",
      iconBg: "bg-red-500 text-white shadow-md shadow-red-500/30",
      dot: "bg-red-500",
      label: activeAnnouncement.pinned ? "Pinned Alert" : "Urgent Update",
      icon: AlertTriangle,
    },
    important: {
      wrapper: "bg-amber-500/10 dark:bg-amber-950/30 border-amber-500/30 shadow-[0_0_24px_-4px_rgba(245,158,11,0.25)]",
      badge: "bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-500/30",
      iconBg: "bg-amber-500 text-white shadow-md shadow-amber-500/30",
      dot: "bg-amber-500",
      label: activeAnnouncement.pinned ? "Pinned Notice" : "Important Announcement",
      icon: Bell,
    },
    normal: {
      wrapper: "bg-uipath-blue/10 dark:bg-blue-950/30 border-uipath-blue/30 shadow-[0_0_24px_-4px_rgba(0,103,223,0.2)]",
      badge: "bg-uipath-blue/20 text-uipath-blue dark:text-blue-300 border-uipath-blue/30",
      iconBg: "bg-uipath-blue text-white shadow-md shadow-uipath-blue/30",
      dot: "bg-uipath-blue",
      label: activeAnnouncement.pinned ? "Pinned Announcement" : "Community News",
      icon: Megaphone,
    },
  };

  const style = priorityConfig[activeAnnouncement.priority] || priorityConfig.normal;
  const Icon = style.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, height: 0, marginTop: 0, marginBottom: 0, transition: { duration: 0.25 } }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="container mx-auto max-w-6xl pt-3 px-4 sm:px-6"
      >
        <div
          className={`relative flex items-center justify-between gap-3 sm:gap-5 rounded-xl border p-2.5 sm:py-3 sm:px-5 backdrop-blur-md transition-all ${style.wrapper}`}
        >
          {/* Decorative glow bar on the left */}
          <div className={`absolute left-0 top-2 bottom-2 w-1 rounded-r-full ${style.dot}`} />

          <div className="flex items-center gap-3 overflow-hidden pl-1.5 sm:pl-0">
            {/* Pulsing icon container */}
            <div className="relative shrink-0">
              <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${style.iconBg} transition-transform hover:scale-105`}>
                <Icon className="h-4 w-4" />
              </span>
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${style.dot} opacity-75`} />
                <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${style.dot}`} />
              </span>
            </div>

            {/* Content snippet */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2.5 text-xs sm:text-sm overflow-hidden">
              <div className="flex items-center gap-1.5">
                <span className={`inline-flex items-center gap-1 border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider rounded ${style.badge}`}>
                  <Sparkles className="h-2.5 w-2.5" />
                  {style.label}
                </span>
              </div>
              <div className="flex items-baseline gap-1.5 overflow-hidden">
                <span className="font-bold text-foreground truncate text-xs sm:text-sm">
                  {activeAnnouncement.title}
                </span>
                {activeAnnouncement.body && (
                  <span className="hidden lg:inline text-muted-foreground text-xs truncate max-w-md">
                    — {activeAnnouncement.body}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/announcements"
              className="group inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-background/80 px-2.5 py-1.5 font-mono text-[11px] font-bold text-foreground shadow-sm transition-all hover:bg-foreground hover:text-background hover:border-transparent"
            >
              <span>View All</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
            <button
              onClick={() => setDismissed(true)}
              className="rounded-lg p-1.5 text-muted-foreground/70 transition-all hover:bg-background/80 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Dismiss banner"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
