"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Download,
  Expand,
  Sparkles,
  Tag,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/shared/spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { useGallery } from "@/lib/hooks";
import type { GalleryItem } from "@/types";

export function GalleryContent() {
  const { data, isLoading } = useGallery();
  const items = (data?.items ?? []) as GalleryItem[];
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Extract unique events/categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) {
      if (item.event && item.event.trim()) {
        set.add(item.event.trim());
      }
    }
    return Array.from(set);
  }, [items]);

  const filteredItems = useMemo(() => {
    if (selectedCategory === "all") return items;
    return items.filter((i) => i.event?.trim() === selectedCategory);
  }, [items, selectedCategory]);

  const selected = selectedIndex !== null ? filteredItems[selectedIndex] : null;

  const handlePrev = useCallback(() => {
    if (selectedIndex === null) return;
    setSelectedIndex((prev) => (prev! > 0 ? prev! - 1 : filteredItems.length - 1));
  }, [selectedIndex, filteredItems.length]);

  const handleNext = useCallback(() => {
    if (selectedIndex === null) return;
    setSelectedIndex((prev) => (prev! < filteredItems.length - 1 ? prev! + 1 : 0));
  }, [selectedIndex, filteredItems.length]);

  useEffect(() => {
    if (selectedIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedIndex(null);
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, handlePrev, handleNext]);

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
              <Camera className="h-4 w-4" />
              Community Moments
            </div>
            <h1 className="font-display text-4xl font-extrabold sm:text-5xl tracking-tight">
              Moments & <span className="text-gradient">Memories</span>
            </h1>
            <p className="mt-3 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              Capturing workshops, bot hackathons, inauguration celebrations, and champion milestones at PSNA CET.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container py-12 max-w-6xl space-y-8">
        {/* Category Filters */}
        {categories.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("all")}
              className="text-xs rounded-xl"
            >
              All Moments ({items.length})
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
                className="text-xs rounded-xl"
              >
                {cat} ({items.filter((i) => i.event?.trim() === cat).length})
              </Button>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner className="h-10 w-10 text-brand-500" />
          </div>
        ) : filteredItems.length === 0 ? (
          <EmptyState
            icon={Camera}
            title="No photos yet"
            description="Gallery photos from community events will appear here once uploaded."
          />
        ) : (
          <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
            {filteredItems.map((item, i) => (
              <motion.div
                key={item.id || i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.02 }}
                onClick={() => setSelectedIndex(i)}
                className="group relative mb-4 cursor-pointer overflow-hidden rounded-2xl border bg-card transition-all duration-300 hover:border-brand-500/50 hover:shadow-xl hover:shadow-brand-500/10"
              >
                <div className="overflow-hidden bg-muted">
                  <img
                    src={item.image}
                    alt={item.caption || "Gallery photo"}
                    className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>

                {/* Hover overlay with expand button */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex flex-col justify-between p-4 text-white">
                  <div className="flex justify-end">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 backdrop-blur-md text-white">
                      <Expand className="h-4 w-4" />
                    </span>
                  </div>
                  <div>
                    {item.event && (
                      <span className="inline-block rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white mb-1">
                        {item.event}
                      </span>
                    )}
                    {item.caption && (
                      <p className="text-xs font-semibold line-clamp-2">{item.caption}</p>
                    )}
                  </div>
                </div>

                {/* Bottom caption bar for non-hover viewing */}
                {(item.caption || item.event) && (
                  <div className="p-3 border-t bg-card/90">
                    {item.caption && (
                      <p className="text-xs font-medium text-foreground line-clamp-1">{item.caption}</p>
                    )}
                    {item.event && (
                      <p className="mt-0.5 text-[10px] font-semibold text-brand-500 uppercase tracking-wider truncate">
                        {item.event}
                      </p>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selected && selectedIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
            onClick={() => setSelectedIndex(null)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative max-h-[90vh] max-w-5xl flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedIndex(null)}
                className="absolute -right-3 -top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white text-black shadow-xl transition-transform hover:scale-110 focus-visible:outline-none"
                aria-label="Close lightbox"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Prev Button */}
              {filteredItems.length > 1 && (
                <button
                  onClick={handlePrev}
                  className="absolute left-2 sm:-left-12 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 border border-white/20 text-white shadow-xl backdrop-blur-md transition-all hover:bg-black hover:scale-110"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
              )}

              {/* Next Button */}
              {filteredItems.length > 1 && (
                <button
                  onClick={handleNext}
                  className="absolute right-2 sm:-right-12 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 border border-white/20 text-white shadow-xl backdrop-blur-md transition-all hover:bg-black hover:scale-110"
                  aria-label="Next photo"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              )}

              {/* Image Frame */}
              <div className="overflow-hidden rounded-2xl border border-white/10 shadow-2xl bg-black">
                <img
                  src={selected.image}
                  alt={selected.caption || "Gallery photo"}
                  className="max-h-[75vh] w-auto max-w-full object-contain rounded-2xl"
                />
              </div>

              {/* Caption & Counter */}
              <div className="mt-3 w-full text-center text-white px-4">
                {selected.event && (
                  <span className="inline-block rounded-full bg-brand-500 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-white mb-1">
                    {selected.event}
                  </span>
                )}
                {selected.caption && (
                  <p className="text-sm font-medium text-white/90">{selected.caption}</p>
                )}
                <p className="text-xs text-white/50 mt-1 font-mono">
                  Photo {selectedIndex + 1} of {filteredItems.length}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

