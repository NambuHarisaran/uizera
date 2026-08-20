"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  Calendar,
  CalendarPlus,
  Clock,
  ExternalLink,
  MapPin,
  Mic,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/shared/spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { SectionHeading } from "@/components/shared/section-heading";
import { useEvents } from "@/lib/hooks";
import { toDate } from "@/lib/utils";
import type { CommunityEvent } from "@/types";

function buildGoogleCalendarUrl(event: CommunityEvent, date: Date | null): string {
  const title = encodeURIComponent(event.title);
  const details = encodeURIComponent(`${event.description}\n\nUiZera Community Event`);
  const location = encodeURIComponent(event.venue || "PSNA CET, Dindigul");

  let datesParam = "";
  if (date) {
    // Format YYYYMMDDTHHmmssZ
    const startIso = date.toISOString().replace(/-|:|\.\d\d\d/g, "");
    // End date +2 hours default
    const endDate = new Date(date.getTime() + 2 * 60 * 60 * 1000);
    const endIso = endDate.toISOString().replace(/-|:|\.\d\d\d/g, "");
    datesParam = `&dates=${startIso}/${endIso}`;
  }

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}${datesParam}`;
}

function EventCard({ event }: { event: CommunityEvent }) {
  const date = toDate(event.date);
  const isPast = date ? date.getTime() < Date.now() : false;
  const isSoon = date ? date.getTime() >= Date.now() && date.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000 : false;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4 }}
      className={`group relative overflow-hidden rounded-2xl border bg-card transition-all duration-300 hover:border-brand-500/40 hover:shadow-xl hover:shadow-brand-500/5 flex flex-col justify-between ${
        isPast ? "opacity-75" : ""
      }`}
    >
      <div>
        {/* Cover Image with Floating Date Stamp */}
        <div className="relative aspect-video overflow-hidden bg-muted">
          {event.image ? (
            <img
              src={event.image}
              alt={event.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-tr from-brand-900/30 to-purple-900/20 flex items-center justify-center">
              <Calendar className="h-12 w-12 text-brand-500/40" />
            </div>
          )}

          {/* Floating Calendar Badge */}
          {date && (
            <div className="absolute top-3 left-3 flex flex-col items-center justify-center rounded-xl bg-card/90 backdrop-blur-md border border-border/80 px-2.5 py-1 text-center shadow-lg">
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-500">
                {format(date, "MMM")}
              </span>
              <span className="font-display text-lg font-black leading-none text-foreground">
                {format(date, "dd")}
              </span>
            </div>
          )}

          {/* Status Badge */}
          <div className="absolute top-3 right-3">
            {isPast ? (
              <Badge variant="secondary" className="backdrop-blur-md bg-card/80 text-xs">
                Past Event
              </Badge>
            ) : isSoon ? (
              <Badge className="bg-amber-500 text-black font-extrabold text-xs shadow-md animate-pulse">
                Happening Soon
              </Badge>
            ) : (
              <Badge variant="success" className="backdrop-blur-md text-xs shadow-md">
                Upcoming
              </Badge>
            )}
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <h3 className="font-display text-lg font-bold group-hover:text-brand-500 transition-colors line-clamp-2">
              {event.title}
            </h3>
            <p className="mt-2 line-clamp-3 text-xs sm:text-sm leading-relaxed text-muted-foreground">
              {event.description}
            </p>
          </div>

          <div className="space-y-2 text-xs text-muted-foreground border-t pt-3">
            {date && (
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-brand-500 shrink-0" />
                <span>{format(date, "EEEE, MMMM dd, yyyy")}</span>
              </div>
            )}
            {event.time && (
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-brand-500 shrink-0" />
                <span>{event.time}</span>
              </div>
            )}
            {event.venue && (
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-brand-500 shrink-0" />
                <span className="truncate">{event.venue}</span>
              </div>
            )}
            {Array.isArray(event.speakers) && event.speakers.length > 0 && (
              <div className="flex items-center gap-2">
                <Mic className="h-3.5 w-3.5 text-brand-500 shrink-0" />
                <span className="font-medium text-foreground truncate">
                  {event.speakers.join(", ")}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 pt-0 flex flex-wrap items-center gap-2">
        {event.registrationLink && !isPast && (
          <Button asChild size="sm" className="gap-1.5 flex-1 font-bold">
            <a href={event.registrationLink} target="_blank" rel="noopener noreferrer">
              Register Now <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
        )}

        {!isPast && (
          <Button
            asChild
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            title="Add to Google Calendar"
          >
            <a href={buildGoogleCalendarUrl(event, date)} target="_blank" rel="noopener noreferrer">
              <CalendarPlus className="h-3.5 w-3.5 text-brand-500" />
              Calendar
            </a>
          </Button>
        )}
      </div>
    </motion.div>
  );
}

export function EventsContent() {
  const { data, isLoading } = useEvents();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("all");

  const events = (data?.events ?? []) as CommunityEvent[];
  const now = Date.now();

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      const d = toDate(e.date)?.getTime() ?? 0;
      if (filter === "upcoming" && d < now) return false;
      if (filter === "past" && d >= now) return false;
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesTitle = e.title.toLowerCase().includes(q);
        const matchesDesc = e.description.toLowerCase().includes(q);
        const matchesVenue = e.venue && e.venue.toLowerCase().includes(q);
        const matchesSpeakers = Array.isArray(e.speakers) && e.speakers.some((s) => s.toLowerCase().includes(q));
        return matchesTitle || matchesDesc || matchesVenue || matchesSpeakers;
      }
      return true;
    });
  }, [events, filter, search, now]);

  const upcoming = filteredEvents.filter((e) => (toDate(e.date)?.getTime() ?? 0) >= now);
  const past = filteredEvents.filter((e) => (toDate(e.date)?.getTime() ?? 0) < now);

  return (
    <div className="pb-24">
      {/* Hero */}
      <section className="hero-glow relative overflow-hidden py-20 border-b">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-20" />
        <div className="container relative">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-3xl text-center"
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-sm font-semibold text-brand-600 dark:text-brand-400">
              <Calendar className="h-4 w-4" />
              Workshops & Meetups
            </div>
            <h1 className="font-display text-4xl font-extrabold sm:text-5xl tracking-tight">
              Community <span className="text-gradient">Events</span>
            </h1>
            <p className="mt-3 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              Hands-on UiPath Studio workshops, Agentic AI webinars, hackathons, and certification bootcamps at PSNA CET.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container py-12 max-w-5xl space-y-10">
        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center bg-muted/60 p-1 rounded-xl w-full sm:w-auto">
            <Button
              variant={filter === "all" ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilter("all")}
              className="text-xs rounded-lg flex-1 sm:flex-none"
            >
              All Events ({events.length})
            </Button>
            <Button
              variant={filter === "upcoming" ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilter("upcoming")}
              className="text-xs rounded-lg flex-1 sm:flex-none"
            >
              Upcoming ({events.filter((e) => (toDate(e.date)?.getTime() ?? 0) >= now).length})
            </Button>
            <Button
              variant={filter === "past" ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilter("past")}
              className="text-xs rounded-lg flex-1 sm:flex-none"
            >
              Past ({events.filter((e) => (toDate(e.date)?.getTime() ?? 0) < now).length})
            </Button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search events, speakers, topics..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs rounded-xl"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner className="h-10 w-10 text-brand-500" />
          </div>
        ) : filteredEvents.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No events found"
            description={
              search
                ? `No events matching "${search}". Try another keyword.`
                : "Events will appear here as soon as they are scheduled. Stay tuned!"
            }
          />
        ) : (
          <div className="space-y-16">
            {upcoming.length > 0 && (
              <section>
                <div className="mb-6 flex items-center justify-between">
                  <SectionHeading title="Upcoming & Active Events" />
                  <Badge variant="outline" className="font-mono text-xs text-brand-500">
                    {upcoming.length} Scheduled
                  </Badge>
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {upcoming.map((e) => (
                    <EventCard key={e.id} event={e} />
                  ))}
                </div>
              </section>
            )}

            {past.length > 0 && (
              <section>
                <div className="mb-6 flex items-center justify-between">
                  <SectionHeading title="Past Events & Recordings" />
                  <Badge variant="outline" className="font-mono text-xs text-muted-foreground">
                    {past.length} Completed
                  </Badge>
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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

