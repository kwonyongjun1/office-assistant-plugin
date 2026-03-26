import { useEffect, useState } from "react";

export type ThemeName = "light" | "dark";

export function useTheme() {
  const [theme, setTheme] = useState<ThemeName>(() => {
    const stored = localStorage.getItem("theme");
    return stored === "dark" ? "dark" : "light";
  });
  const [themeAnimating, setThemeAnimating] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setThemeAnimating(true);
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
    window.setTimeout(() => setThemeAnimating(false), 450);
  };

  return {
    theme,
    themeAnimating,
    toggleTheme,
  };
}
