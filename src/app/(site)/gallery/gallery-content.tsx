"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, X } from "lucide-react";
import { Spinner } from "@/components/shared/spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { useGallery } from "@/lib/hooks";
import type { GalleryItem } from "@/types";

export function GalleryContent() {
  const { data, isLoading } = useGallery();
  const items = (data?.items ?? []) as GalleryItem[];
  const [selected, setSelected] = useState<GalleryItem | null>(null);

  useEffect(() => {
    if (!selected) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selected]);


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
              <Camera className="h-4 w-4" />
              Gallery
            </div>
            <h1 className="font-display text-4xl font-bold sm:text-5xl">
              Community <span className="text-gradient">Moments</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Highlights from our events, workshops, and celebrations.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container py-16">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner className="h-8 w-8" />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={Camera}
            title="No photos yet"
            description="Gallery photos will appear here once added."
          />
        ) : (
          <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
            {items.map((item, i) => (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.03 }}
                onClick={() => setSelected(item)}
                className="group mb-4 block w-full overflow-hidden rounded-xl border bg-card transition-all duration-300 hover:border-brand-500/30 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.caption || "Gallery photo"}
                    className="w-full transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                {(item.caption || item.event) && (
                  <div className="p-3">
                    {item.caption && (
                      <p className="text-sm text-foreground">{item.caption}</p>
                    )}
                    {item.event && (
                      <p className="mt-0.5 text-xs text-muted-foreground">{item.event}</p>
                    )}
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative max-h-[85vh] max-w-5xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelected(null)}
                className="absolute -right-2 -top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white text-black shadow-lg transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Close lightbox"
              >
                <X className="h-4 w-4" />
              </button>
              <img
                src={selected.image}
                alt={selected.caption || "Gallery photo"}
                className="max-h-[85vh] rounded-xl object-contain"
              />
              {selected.caption && (
                <p className="mt-3 text-center text-sm text-white/80">{selected.caption}</p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
