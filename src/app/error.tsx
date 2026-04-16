"use client";

import { useEffect } from "react";

/**
 * Next.js App Router error boundary.
 * Shown whenever an unhandled render error occurs within the route segment.
 */
export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service in production
        console.error(error);
    }, [error]);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-bg)] text-[var(--color-text)] px-4">
            <div className="max-w-md w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center space-y-4">
                <h2 className="text-lg font-semibold text-[var(--color-destructive)]">Something went wrong</h2>
                <p className="text-sm text-[var(--color-text-secondary)]">
                    {error.message || "An unexpected error occurred. Please try again."}
                </p>
                <button
                    onClick={reset}
                    className="inline-flex items-center justify-center rounded-lg bg-[var(--color-primary)] px-6 py-2 text-sm font-medium text-[var(--color-primary-foreground)] hover:opacity-90 transition"
                >
                    Try again
                </button>
            </div>
        </div>
    );
}
