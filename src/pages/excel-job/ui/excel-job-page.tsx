import clsx from "clsx";
import { useEffect } from "react";
import { useExcelJob } from "@/features/excel-job/model/use-excel-job";
import { appToast } from "@/shared/lib/toast";

type ExcelJobPageProps = {
  onBack: () => void;
};

export function ExcelJobPage({ onBack }: ExcelJobPageProps) {
  const { month, setMonth, minMonth, maxMonth, isLoading, result, canSubmit, validationError, run } =
    useExcelJob();

  useEffect(() => {
    if (!result) {
      return;
    }

    if (result.ok) {
      if (result.copiedText !== undefined) {
        appToast.success("복사가 완료되었습니다.");
      } else {
        appToast.success("다운로드가 완료되었습니다.");
      }
    }
  }, [result]);

  return (
    <main className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-700"
        >
          Back
        </button>
        <h2 className="text-sm font-bold">월간 근태현황</h2>
      </div>

      <label className="block">
        <span className="mb-1 block text-xs text-slate-500 dark:text-slate-300">Month</span>
        <input
          type="month"
          value={month}
          min={minMonth}
          max={maxMonth}
          onChange={(event) => setMonth(event.target.value)}
          className={clsx(
            "w-full rounded-xl border bg-slate-50 px-3 py-2 text-sm outline-none ring-sky-400 transition focus:ring-1 dark:bg-slate-900",
            validationError
              ? "border-rose-400 dark:border-rose-500"
              : "border-slate-300 dark:border-slate-700"
          )}
        />
        <p
          className={clsx(
            "mt-1 text-xs",
            validationError ? "text-rose-500" : "text-slate-500 dark:text-slate-400"
          )}
        >
          {validationError ?? ``}
        </p>
      </label>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => run("DOWNLOAD_MONTHLY_EXCEL")}
          disabled={isLoading || !canSubmit}
          className="rounded-xl bg-sky-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-500"
        >
          {isLoading ? "Processing..." : "다운로드"}
        </button>
        <button
          type="button"
          onClick={() => run("COPY_MONTHLY_EXCEL_RANGE")}
          disabled={isLoading || !canSubmit}
          className="rounded-xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-500"
        >
          {isLoading ? "Processing..." : "복사하기"}
        </button>
      </div>
    </main>
  );
}
