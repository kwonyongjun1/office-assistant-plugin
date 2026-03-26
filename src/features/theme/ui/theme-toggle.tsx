import type { ThemeName } from "@/features/theme/model/use-theme";
import { MoonIcon, SunIcon } from "@/shared/ui/icons";

type ThemeToggleProps = {
  theme: ThemeName;
  themeAnimating: boolean;
  onToggle: () => void;
};

export function ThemeToggle({ theme, themeAnimating, onToggle }: ThemeToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white shadow-sm transition hover:scale-105 dark:border-slate-700 dark:bg-slate-800"
      aria-label="theme toggle"
    >
      <span
        className={[
          "relative h-5 w-5 transition-transform duration-500",
          themeAnimating ? "rotate-180" : "rotate-0",
        ].join(" ")}
      >
        <span
          className={[
            "absolute inset-0 flex items-center justify-center text-amber-500 transition-all duration-300",
            theme === "light" ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-0 -rotate-90",
          ].join(" ")}
        >
          <SunIcon />
        </span>
        <span
          className={[
            "absolute inset-0 flex items-center justify-center text-violet-400 transition-all duration-300",
            theme === "dark" ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-0 rotate-90",
          ].join(" ")}
        >
          <MoonIcon />
        </span>
      </span>
    </button>
  );
}
