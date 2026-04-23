"use client";

import { useEffect, useState, useCallback } from "react";

export type Theme = "dark" | "light";

function applyTheme(theme: Theme) {
    if (theme === "dark") {
        document.documentElement.classList.add("dark");
    } else {
        document.documentElement.classList.remove("dark");
    }
}

export function useTheme() {
    const [theme, setTheme] = useState<Theme>("dark");

    useEffect(() => {
        const initial: Theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        setTheme(initial);
        applyTheme(initial);
    }, []);

    const toggleTheme = useCallback(() => {
        setTheme((prev) => {
            const next: Theme = prev === "dark" ? "light" : "dark";
            applyTheme(next);
            return next;
        });
    }, []);

    return { theme, toggleTheme };
}
