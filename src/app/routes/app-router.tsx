import { useEffect } from "react";
import { ExcelJobPage } from "@/pages/excel-job/ui/excel-job-page";
import { MainPage } from "@/pages/main/ui/main-page";
import { sendRuntimeMessage } from "@/shared/lib/chrome/send-runtime-message";
import { useHashRoute } from "@/shared/lib/routing/hash-route";
import type { CheckSessionRequest, CheckSessionResponse } from "@/shared/types/excel-job";

export function AppRouter() {
  const { route, navigate } = useHashRoute();

  useEffect(() => {
    if (typeof chrome === "undefined" || !chrome.runtime?.id) {
      return;
    }

    void sendRuntimeMessage<CheckSessionRequest, CheckSessionResponse>({
      type: "CHECK_SESSION",
    });
  }, []);

  if (route === "excel-job") {
    return <ExcelJobPage onBack={() => navigate("main")} />;
  }

  return <MainPage onNavigate={navigate} />;
}
