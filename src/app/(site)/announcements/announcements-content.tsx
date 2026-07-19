"use client";

import { motion } from "framer-motion";
import { format } from "date-fns";
import { AlertTriangle, Bell, Info, Megaphone, Pin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/shared/spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { useAnnouncements } from "@/lib/hooks";
import { toDate } from "@/lib/utils";
import type { Announcement } from "@/types";

const priorityConfig = {
  urgent: { icon: AlertTriangle, color: "bg-destructive/10 text-destructive", label: "Urgent" },
  important: { icon: Bell, color: "bg-amber-500/10 text-amber-600 dark:text-amber-400", label: "Important" },
  normal: { icon: Info, color: "bg-sky-500/10 text-sky-600 dark:text-sky-400", label: "Info" },
};

function AnnouncementCard({ item }: { item: Announcement }) {
  const config = priorityConfig[item.priority];
  const Icon = config.icon;
  const date = toDate(item.publishedAt);

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border bg-card p-6 transition-all duration-300 hover:border-brand-500/20"
    >
      <div className="mb-3 flex items-center gap-3">
        <Badge className={config.color}>
          <Icon className="mr-1 h-3 w-3" />
          {config.label}
        </Badge>
        {item.pinned && (
          <Badge variant="outline" className="gap-1">
            <Pin className="h-3 w-3" /> Pinned
          </Badge>
        )}
        {date && (
          <span className="ml-auto text-xs text-muted-foreground">
            {format(date, "PP")}
          </span>
        )}
      </div>
      <h3 className="mb-2 font-display text-lg font-semibold">{item.title}</h3>
      <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
        <p className="whitespace-pre-wrap">{item.body}</p>
      </div>
    </motion.article>
  );
}

export function AnnouncementsContent() {
  const { data, isLoading } = useAnnouncements();
  const items = (data?.items ?? []) as Announcement[];

  // Pinned first, then by priority, then by date
  const sorted = [...items].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    const pOrder = { urgent: 0, important: 1, normal: 2 };
    if (pOrder[a.priority] !== pOrder[b.priority]) return pOrder[a.priority] - pOrder[b.priority];
    return 0;
  });

  return (
    <div className="pb-24">
      <section className="hero-glow relative overflow-hidden py-24">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-20" />
        <div className="container relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl text-center"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-sm font-medium text-brand-600 dark:text-brand-400">
              <Megaphone className="h-4 w-4" />
              Announcements
            </div>
            <h1 className="font-display text-4xl font-bold sm:text-5xl">
              Latest <span className="text-gradient">Updates</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Stay informed about what&apos;s happening in the community.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container max-w-3xl py-16">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner className="h-8 w-8" />
          </div>
        ) : sorted.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            title="No announcements yet"
            description="Announcements will appear here when posted by admins."
          />
        ) : (
          <div className="space-y-4">
            {sorted.map((item) => (
              <AnnouncementCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
