import { useState, useEffect, useMemo } from "react";

export function useTimer() {
  const [isRunning, setIsRunning] = useState(false);
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (!isRunning || !startedAt) return;
    const id = window.setInterval(() => {
      setElapsedMs(Date.now() - startedAt.getTime());
    }, 500);
    return () => window.clearInterval(id);
  }, [isRunning, startedAt]);

  const currentElapsed = useMemo(() => {
    if (!isRunning || !startedAt) return elapsedMs;
    return Date.now() - startedAt.getTime();
  }, [elapsedMs, isRunning, startedAt]);

  const formattedElapsed = useMemo(() => {
    const totalSeconds = Math.floor(currentElapsed / 1000);
    const hours = Math.floor(totalSeconds / 3600)
      .toString()
      .padStart(2, "0");
    const minutes = Math.floor((totalSeconds % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  }, [currentElapsed]);

  return {
    isRunning,
    setIsRunning,
    startedAt,
    setStartedAt,
    elapsedMs,
    setElapsedMs,
    currentElapsed,
    formattedElapsed,
  };
}
