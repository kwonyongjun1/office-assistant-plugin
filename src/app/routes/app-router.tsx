import { useTheme } from "@/features/theme/model/use-theme";
import { ExcelJobPage } from "@/pages/excel-job/ui/excel-job-page";
import { MainPage } from "@/pages/main/ui/main-page";
import { useHashRoute } from "@/shared/lib/routing/hash-route";

export function AppRouter() {
  const { route, navigate } = useHashRoute();
  const { theme, themeAnimating, toggleTheme } = useTheme();

  if (route === "excel-job") {
    return <ExcelJobPage onBack={() => navigate("main")} />;
  }

  return (
    <MainPage
      onNavigate={navigate}
      theme={theme}
      themeAnimating={themeAnimating}
      onToggleTheme={toggleTheme}
    />
  );
}
