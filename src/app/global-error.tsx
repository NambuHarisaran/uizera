"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
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
    <html lang="en">
      <body className="flex min-h-dvh flex-col items-center justify-center bg-black px-4 font-sans text-center text-white">
        <span className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
          <AlertTriangle className="h-8 w-8" />
        </span>
        <h1 className="text-2xl font-bold">
          {isChunkError ? "New update available" : "Something went wrong"}
        </h1>
        <p className="mt-2 max-w-md text-sm text-neutral-400">
          {isChunkError
            ? "A newer version of UiZera was deployed or your connection timed out while fetching assets. Click below to reload."
            : "An unexpected error occurred in the application layout."}
        </p>
        <button
          onClick={() => {
            if (isChunkError) {
              window.location.reload();
            } else {
              reset();
            }
          }}
          className="mt-8 inline-flex items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:bg-neutral-200 transition-colors"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Reload Page
        </button>
      </body>
    </html>
  );
}
