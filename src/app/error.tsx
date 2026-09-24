"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isChunkError =
    error?.name === "ChunkLoadError" ||
    /Loading chunk .* failed/i.test(error?.message || "");

  useEffect(() => {
    console.error(error);
    if (isChunkError) {
      const key = "uizera_chunk_reload";
      const last = sessionStorage.getItem(key);
      const now = Date.now();
      if (!last || now - parseInt(last, 10) > 15000) {
        sessionStorage.setItem(key, now.toString());
        window.location.reload();
      }
    }
  }, [error, isChunkError]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <span className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertTriangle className="h-8 w-8" />
      </span>
      <h1 className="font-display text-2xl font-bold">
        {isChunkError ? "New update available" : "Something went wrong"}
      </h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {isChunkError
          ? "A new version of UiZera was deployed or your network timed out while loading assets. Refreshing will load the latest version."
          : "An unexpected error occurred. Try again — if it keeps happening, let the UiZera team know."}
      </p>
      <Button
        onClick={() => {
          if (isChunkError) {
            window.location.reload();
          } else {
            reset();
          }
        }}
        className="mt-8"
      >
        {isChunkError ? (
          <>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reload Page
          </>
        ) : (
          "Try again"
        )}
      </Button>
    </main>
  );
}
