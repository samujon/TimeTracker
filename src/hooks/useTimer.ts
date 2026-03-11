"use client";

import { useState, useEffect, useMemo, useCallback } from "react";

export function useTimer() {
  const [isRunning, setIsRunning] = useState(false);
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (!isRunning || !startedAt) return;
    // Use plain setInterval — window.setInterval breaks in SSR environments.
    const id = setInterval(() => {
      setElapsedMs(Date.now() - startedAt.getTime());
    }, 500);
    return () => clearInterval(id);
  }, [isRunning, startedAt]);

  const currentElapsed = useMemo(() => {
    if (!isRunning || !startedAt) return elapsedMs;
    return Date.now() - startedAt.getTime();
  }, [elapsedMs, isRunning, startedAt]);

  const formattedElapsed = useMemo(() => {
    const totalSeconds = Math.floor(currentElapsed / 1000);
    const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, "0");
    const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, "0");
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  }, [currentElapsed]);

  /** Begin timing from now. */
  const start = useCallback(() => {
    setStartedAt(new Date());
    setElapsedMs(0);
    setIsRunning(true);
  }, []);

  /**
   * Pause the timer without clearing `startedAt`.
   * Call `reset()` after you have finished reading `startedAt`.
   */
  const stop = useCallback(() => {
    setIsRunning(false);
  }, []);

  /** Clear timer state back to initial values. */
  const reset = useCallback(() => {
    setIsRunning(false);
    setStartedAt(null);
    setElapsedMs(0);
  }, []);

  return {
    isRunning,
    startedAt,        // read-only — do NOT mutate from outside
    formattedElapsed,
    start,
    stop,
    reset,
  };
}
