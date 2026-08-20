"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        aria-label="Toggle theme"
        className={cn(
          "h-9 w-9 rounded-xl border border-transparent text-muted-foreground",
          className
        )}
      >
        <span className="h-4 w-4 rounded-full bg-muted/60" />
      </Button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.92 }} className="relative inline-flex">
      <Button
        variant="ghost"
        size="icon"
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className={cn(
          "relative h-9 w-9 rounded-xl border border-border/50 bg-background/50 backdrop-blur-sm text-foreground transition-colors hover:bg-accent hover:border-brand-500/30 hover:text-brand-500",
          className
        )}
      >
        <AnimatePresence mode="wait" initial={false}>
          {isDark ? (
            <motion.div
              key="sun"
              initial={{ rotate: -90, scale: 0, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: 90, scale: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="flex items-center justify-center text-amber-400"
            >
              <Sun className="h-4 w-4" />
            </motion.div>
          ) : (
            <motion.div
              key="moon"
              initial={{ rotate: 90, scale: 0, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: -90, scale: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="flex items-center justify-center text-slate-700 dark:text-slate-200"
            >
              <Moon className="h-4 w-4" />
            </motion.div>
          )}
        </AnimatePresence>
      </Button>
    </motion.div>
  );
}
