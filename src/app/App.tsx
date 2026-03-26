import { AppRouter } from "@/app/routes/app-router";
import { useTheme } from "@/features/theme/model/use-theme";
import { ThemeToggle } from "@/features/theme/ui/theme-toggle";
import { Toaster } from "sonner";

function App() {
  const { theme, themeAnimating, toggleTheme } = useTheme();

  return (
    <div className="w-[390px] bg-slate-200 p-4 text-slate-900 transition-colors dark:bg-slate-900 dark:text-slate-100">
      <header className="mb-3 flex justify-end">
        <ThemeToggle theme={theme} themeAnimating={themeAnimating} onToggle={toggleTheme} />
      </header>
      <AppRouter />
      <Toaster richColors position="top-center" theme="system" />
    </div>
  );
}

export default App;
