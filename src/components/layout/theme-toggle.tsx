"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Theme = "light" | "dark";

function getPreferredTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const savedTheme = window.localStorage.getItem("bitenow-theme");
  if (savedTheme === "light" || savedTheme === "dark") return savedTheme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    setTheme(getPreferredTheme());
  }, []);

  function toggleTheme() {
    const nextTheme: Theme = theme === "light" ? "dark" : "light";
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
    window.localStorage.setItem("bitenow-theme", nextTheme);
    setTheme(nextTheme);
  }

  const isDark = theme === "dark";

  return (
    <button
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      className={cn(
        "theme-toggle inline-flex items-center justify-center rounded-full border transition-all duration-300 hover:-translate-y-0.5 focus-visible:outline-none",
        compact ? "h-9 w-9" : "h-11 w-11"
      )}
      onClick={toggleTheme}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
      type="button"
    >
      <Sun aria-hidden className={cn("absolute h-[18px] w-[18px] transition-all duration-300", isDark ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100")} />
      <Moon aria-hidden className={cn("absolute h-[17px] w-[17px] transition-all duration-300", isDark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0")} />
    </button>
  );
}
