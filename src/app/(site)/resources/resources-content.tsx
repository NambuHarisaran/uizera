"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  Code,
  Copy,
  ExternalLink,
  FileCode,
  FileText,
  Globe,
  Search,
  Sparkles,
  Tag,
  Video,
  X,
} from "lucide-react";
import { toast } from "sonner";
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
  career: "Career & Interview",
  video: "Video Tutorials",
  documentation: "Documentation",
  other: "Other Guides",
};

const categoryColors: Record<ResourceCategory, string> = {
  getting_started: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  uipath_studio: "bg-brand-500/10 text-brand-600 dark:text-brand-400 border-brand-500/20",
  certification: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  agentic_ai: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
  career: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
  video: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  documentation: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
  other: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

function getFormatBadge(resource: LearningResource): { label: string; icon: typeof FileText; color: string } {
  const url = resource.url.toLowerCase();
  const title = resource.title.toLowerCase();
  const desc = resource.description.toLowerCase();

  if (url.includes("youtube.com") || url.includes("youtu.be") || resource.category === "video") {
    return { label: "Video", icon: Video, color: "text-rose-500 bg-rose-500/10 border-rose-500/20" };
  }
  if (url.endsWith(".pdf") || title.includes("pdf") || desc.includes("pdf")) {
    return { label: "PDF Guide", icon: FileText, color: "text-amber-500 bg-amber-500/10 border-amber-500/20" };
  }
  if (url.includes("github.com") || url.includes("gitlab.com")) {
    return { label: "GitHub Repo", icon: Code, color: "text-purple-500 bg-purple-500/10 border-purple-500/20" };
  }
  if (url.includes("docs.uipath.com") || resource.category === "documentation") {
    return { label: "Docs", icon: BookOpen, color: "text-brand-500 bg-brand-500/10 border-brand-500/20" };
  }
  return { label: "Web Guide", icon: Globe, color: "text-blue-500 bg-blue-500/10 border-blue-500/20" };
}

export function ResourcesContent() {
  const { data, isLoading } = useResources();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<ResourceCategory | "all">("all");

  const resources = (data?.items ?? []) as LearningResource[];
  const categories = Array.from(new Set(resources.map((r) => r.category)));

  const filtered = useMemo(() => {
    return resources.filter((r) => {
      if (activeCategory !== "all" && r.category !== activeCategory) return false;
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        return (
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          (r.tags ?? []).some((t) => t.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [resources, activeCategory, search]);

  const handleCopyLink = (e: React.MouseEvent, url: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      toast.success("Resource URL copied to clipboard!");
    }
  };

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
              <BookOpen className="h-4 w-4" />
              Learning Library
            </div>
            <h1 className="font-display text-4xl font-extrabold sm:text-5xl tracking-tight">
              Automation <span className="text-gradient">Resources</span>
            </h1>
            <p className="mt-3 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              Curated official UiPath guides, Agentic AI blueprints, video tutorials, and certification cheat sheets for PSNA CET students.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container py-12 max-w-6xl space-y-8">
        {/* Filters & Search Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search guides, Studio activities, certs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-9 text-xs rounded-xl"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              variant={activeCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory("all")}
              className="text-xs rounded-xl"
            >
              All ({resources.length})
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={activeCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory(cat)}
                className="text-xs rounded-xl capitalize"
              >
                {categoryLabels[cat] ?? cat} ({resources.filter((r) => r.category === cat).length})
              </Button>
            ))}
          </div>
        </div>

        {/* Resources Grid */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner className="h-10 w-10 text-brand-500" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No resources match your search"
            description={search ? `No matches found for "${search}". Try clearing search filters.` : "Resources will appear here once added by community mentors."}
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((r, i) => {
              const formatMeta = getFormatBadge(r);
              const FormatIcon = formatMeta.icon;

              return (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: i * 0.02 }}
                >
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative flex h-full flex-col justify-between rounded-2xl border bg-card p-5 transition-all duration-300 hover:border-brand-500/50 hover:shadow-xl hover:shadow-brand-500/5"
                  >
                    <div>
                      {/* Top Badges: Category + Format */}
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              categoryColors[r.category] || "bg-muted text-muted-foreground"
                            }`}
                          >
                            {categoryLabels[r.category] || r.category}
                          </span>

                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${formatMeta.color}`}
                          >
                            <FormatIcon className="h-3 w-3" />
                            {formatMeta.label}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => handleCopyLink(e, r.url)}
                            className="rounded-lg p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100"
                            title="Copy resource URL"
                            aria-label="Copy resource URL"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                          <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                        </div>
                      </div>

                      <h3 className="font-display text-base font-bold text-foreground group-hover:text-brand-500 transition-colors">
                        {r.title}
                      </h3>

                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground line-clamp-3">
                        {r.description}
                      </p>
                    </div>

                    {/* Tags Footer */}
                    {Array.isArray(r.tags) && r.tags.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-1.5 border-t pt-3">
                        {r.tags.slice(0, 4).map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 rounded-md bg-muted/60 border px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                          >
                            <Tag className="h-2.5 w-2.5" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </a>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

