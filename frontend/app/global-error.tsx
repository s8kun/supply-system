"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="p-6">
        <main className="mx-auto max-w-xl space-y-3">
          <h2 className="text-xl font-semibold">Application Error</h2>
          <p className="text-sm text-muted-foreground">
            {error.message || "An unrecoverable error occurred."}
          </p>
          <Button type="button" onClick={reset}>
            Reload UI
          </Button>
        </main>
      </body>
    </html>
  );
}
