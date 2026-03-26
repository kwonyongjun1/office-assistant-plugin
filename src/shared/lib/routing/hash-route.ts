import { useEffect, useState } from "react";

export type AppRoute = "main" | "excel-job";

function parseRoute(hash: string): AppRoute {
  return hash === "#/excel-job" ? "excel-job" : "main";
}

export function useHashRoute() {
  const [route, setRoute] = useState<AppRoute>(() => parseRoute(window.location.hash));

  useEffect(() => {
    const handleHashChange = () => setRoute(parseRoute(window.location.hash));
    window.addEventListener("hashchange", handleHashChange);
    if (!window.location.hash) {
      window.location.hash = "#/";
    }
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const navigate = (nextRoute: AppRoute) => {
    window.location.hash = nextRoute === "main" ? "#/" : "#/excel-job";
  };

  return { route, navigate };
}
