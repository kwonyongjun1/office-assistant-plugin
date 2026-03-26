import { ExcelJobPage } from "@/pages/excel-job/ui/excel-job-page";
import { MainPage } from "@/pages/main/ui/main-page";
import { useHashRoute } from "@/shared/lib/routing/hash-route";

export function AppRouter() {
  const { route, navigate } = useHashRoute();

  if (route === "excel-job") {
    return <ExcelJobPage onBack={() => navigate("main")} />;
  }

  return <MainPage onNavigate={navigate} />;
}
