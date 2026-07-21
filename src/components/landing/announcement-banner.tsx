"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Bell, Megaphone, ArrowRight, X } from "lucide-react";
import { useAnnouncements } from "@/lib/hooks";

export function AnnouncementBanner() {
  const { data } = useAnnouncements();
  const [dismissed, setDismissed] = useState(false);

  const items = data?.items ?? [];
  const activeAnnouncement = items.find((i) => i.pinned || i.priority === "urgent" || i.priority === "important") || items[0];

  if (dismissed || !activeAnnouncement) return null;

  const priorityColors = {
    urgent: "bg-destructive/15 border-destructive/30 text-destructive dark:text-red-400",
    important: "bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400",
    normal: "bg-brand-500/15 border-brand-500/30 text-brand-600 dark:text-brand-400",
  };

  const Icon = activeAnnouncement.priority === "urgent" ? AlertTriangle : activeAnnouncement.priority === "important" ? Bell : Megaphone;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, height: 0 }}
        className="container mx-auto max-w-6xl pt-4"
      >
        <div className={`relative flex items-center justify-between gap-4 rounded-2xl border p-3.5 sm:px-6 backdrop-blur-md shadow-sm transition-all ${priorityColors[activeAnnouncement.priority]}`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-background/80 shadow-sm">
              <Icon className="h-4 w-4" />
            </span>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs sm:text-sm overflow-hidden">
              <span className="font-bold uppercase tracking-wider text-[11px] opacity-80">
                {activeAnnouncement.pinned ? "Pinned Announcement" : `${activeAnnouncement.priority} Announcement`}
              </span>
              <span className="font-semibold text-foreground truncate">
                {activeAnnouncement.title}
              </span>
              <span className="hidden md:inline text-muted-foreground truncate max-w-md">
                — {activeAnnouncement.body}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/announcements"
              className="inline-flex items-center gap-1 text-xs font-bold underline-offset-4 hover:underline text-foreground"
            >
              View All <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <button
              onClick={() => setDismissed(true)}
              className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-background/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
