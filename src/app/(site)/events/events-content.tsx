"use client";

import { motion } from "framer-motion";
import { format } from "date-fns";
import { Calendar, Clock, ExternalLink, MapPin, Mic, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/shared/spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { SectionHeading } from "@/components/shared/section-heading";
import { useEvents } from "@/lib/hooks";
import { toDate } from "@/lib/utils";
import type { CommunityEvent } from "@/types";

function EventCard({ event }: { event: CommunityEvent }) {
  const date = toDate(event.date);
  const isPast = date ? date.getTime() < Date.now() : false;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4 }}
      className={`group overflow-hidden rounded-2xl border bg-card transition-all duration-300 hover:border-brand-500/30 hover:shadow-lg hover:shadow-brand-500/5 ${
        isPast ? "opacity-70" : ""
      }`}
    >
      {event.image && (
        <div className="aspect-video overflow-hidden bg-muted">
          <img
            src={event.image}
            alt={event.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      )}
      <div className="p-6">
        <div className="mb-3 flex items-center gap-2">
          {isPast ? (
            <Badge variant="secondary">Past Event</Badge>
          ) : (
            <Badge variant="success">Upcoming</Badge>
          )}
        </div>
        <h3 className="mb-2 font-display text-lg font-semibold">{event.title}</h3>
        <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
          {event.description}
        </p>

        <div className="space-y-2 text-sm text-muted-foreground">
          {date && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-brand-500" />
              {format(date, "PPP")}
            </div>
          )}
          {event.time && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-brand-500" />
              {event.time}
            </div>
          )}
          {event.venue && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-brand-500" />
              {event.venue}
            </div>
          )}
          {event.speakers.length > 0 && (
            <div className="flex items-center gap-2">
              <Mic className="h-4 w-4 text-brand-500" />
              {event.speakers.join(", ")}
            </div>
          )}
        </div>

        {event.registrationLink && !isPast && (
          <Button asChild size="sm" className="mt-5 gap-2">
            <a href={event.registrationLink} target="_blank" rel="noopener noreferrer">
              Register <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
        )}
      </div>
    </motion.div>
  );
}

export function EventsContent() {
  const { data, isLoading } = useEvents();
  const events = (data?.events ?? []) as CommunityEvent[];
  const now = Date.now();
  const upcoming = events.filter((e) => (toDate(e.date)?.getTime() ?? 0) >= now);
  const past = events.filter((e) => (toDate(e.date)?.getTime() ?? 0) < now);

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
              <Calendar className="h-4 w-4" />
              Events
            </div>
            <h1 className="font-display text-4xl font-bold sm:text-5xl">
              Community <span className="text-gradient">Events</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Workshops, hackathons, webinars, and meetups to supercharge your automation skills.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container py-16">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner className="h-8 w-8" />
          </div>
        ) : events.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No events yet"
            description="Events will appear here when they're announced. Stay tuned!"
          />
        ) : (
          <div className="space-y-16">
            {upcoming.length > 0 && (
              <section>
                <SectionHeading title="Upcoming Events" />
                <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {upcoming.map((e) => (
                    <EventCard key={e.id} event={e} />
                  ))}
                </div>
              </section>
            )}

            {past.length > 0 && (
              <section>
                <SectionHeading title="Past Events" />
                <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {past.map((e) => (
                    <EventCard key={e.id} event={e} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
