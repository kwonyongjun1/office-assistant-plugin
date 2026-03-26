import { AppRouter } from "@/app/routes/app-router";
import { Toaster } from "sonner";

function App() {
  return (
    <div className="w-[390px] bg-slate-200 p-4 text-slate-900 transition-colors dark:bg-slate-900 dark:text-slate-100">
      <AppRouter />
      <Toaster richColors position="top-center" theme="system" />
    </div>
  );
}

export default App;
