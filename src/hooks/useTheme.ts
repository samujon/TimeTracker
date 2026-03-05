"use client";

import { useEffect, useState, useCallback } from "react";

export type Theme = "dark" | "light";

export function useTheme() {
    const [theme, setTheme] = useState<Theme>("dark");

    useEffect(() => {
        const stored = localStorage.getItem("theme") as Theme | null;
        const initial: Theme = stored === "light" ? "light" : "dark";
        setTheme(initial);
        if (initial === "dark") {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    }, []);

    const toggleTheme = useCallback(() => {
        setTheme((prev) => {
            const next: Theme = prev === "dark" ? "light" : "dark";
            localStorage.setItem("theme", next);
            if (next === "dark") {
                document.documentElement.classList.add("dark");
            } else {
                document.documentElement.classList.remove("dark");
            }
            return next;
        });
    }, []);

    return { theme, toggleTheme };
}
