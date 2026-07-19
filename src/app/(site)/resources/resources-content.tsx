"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, ExternalLink, Search, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/shared/spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { useResources } from "@/lib/hooks";
import type { LearningResource, ResourceCategory } from "@/types";

const categoryLabels: Record<ResourceCategory, string> = {
  getting_started: "Getting Started",
  uipath_studio: "UiPath Studio",
  certification: "Certification",
  agentic_ai: "Agentic AI",
  career: "Career",
  video: "Video",
  documentation: "Documentation",
  other: "Other",
};

const categoryColors: Record<ResourceCategory, string> = {
  getting_started: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  uipath_studio: "bg-brand-500/10 text-brand-600 dark:text-brand-400",
  certification: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  agentic_ai: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  career: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  video: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  documentation: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  other: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
};

export function ResourcesContent() {
  const { data, isLoading } = useResources();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<ResourceCategory | "all">("all");

  const resources = (data?.items ?? []) as LearningResource[];

  const categories = Array.from(new Set(resources.map((r) => r.category)));

  const filtered = resources.filter((r) => {
    if (activeCategory !== "all" && r.category !== activeCategory) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return true;
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
              <BookOpen className="h-4 w-4" />
              Resources
            </div>
            <h1 className="font-display text-4xl font-bold sm:text-5xl">
              Learning <span className="text-gradient">Resources</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Curated guides, videos, and documentation to accelerate your automation journey.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container py-16">
        {/* Filters */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search resources..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={activeCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory("all")}
            >
              All
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={activeCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory(cat)}
              >
                {categoryLabels[cat] ?? cat}
              </Button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner className="h-8 w-8" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No resources found"
            description={search ? "Try a different search term." : "Resources will appear here once added."}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((r, i) => (
              <motion.a
                key={r.id}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.03 }}
                className="group flex flex-col rounded-xl border bg-card p-5 transition-all duration-300 hover:border-brand-500/30 hover:shadow-lg hover:shadow-brand-500/5"
              >
                <div className="mb-3 flex items-center justify-between">
                  <Badge className={categoryColors[r.category]}>
                    {categoryLabels[r.category]}
                  </Badge>
                  <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <h3 className="mb-1 font-display text-sm font-semibold group-hover:text-brand-500">
                  {r.title}
                </h3>
                <p className="mb-3 flex-1 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                  {r.description}
                </p>
                {r.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {r.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                      >
                        <Tag className="h-2.5 w-2.5" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </motion.a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
