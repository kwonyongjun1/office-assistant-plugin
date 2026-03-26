import clsx from "clsx";
import type { AppRoute } from "@/shared/lib/routing/hash-route";
import {
  CalendarIcon,
  ChartIcon,
  CheckIcon,
  ComingSoonIcon,
  ClockIcon,
  DocumentIcon,
  FolderIcon,
  MailIcon,
  MessageIcon,
  TargetIcon,
} from "@/shared/ui/icons";

type MainPageProps = {
  onNavigate: (route: AppRoute) => void;
};

export function MainPage({ onNavigate }: MainPageProps) {
  const cards = [
    {
      label: "근태현황",
      color: "from-emerald-500 to-green-500",
      icon: <CalendarIcon />,
      enabled: true,
      onClick: () => onNavigate("excel-job"),
    },
    { label: "시간 관리", color: "from-sky-500 to-blue-500", icon: <ClockIcon />, enabled: false },
    { label: "메모", color: "from-amber-500 to-orange-500", icon: <DocumentIcon />, enabled: false },
    { label: "일정 관리", color: "from-fuchsia-500 to-pink-500", icon: <CheckIcon />, enabled: false },
    { label: "템플릿", color: "from-rose-500 to-red-500", icon: <MailIcon />, enabled: false },
    { label: "생산성 분석", color: "from-indigo-500 to-blue-500", icon: <ChartIcon />, enabled: false },
    { label: "문서 관리", color: "from-cyan-500 to-teal-500", icon: <FolderIcon />, enabled: false },
    { label: "메시지", color: "from-violet-500 to-purple-500", icon: <MessageIcon />, enabled: false },
    { label: "목표 설정", color: "from-pink-500 to-fuchsia-500", icon: <TargetIcon />, enabled: false },
  ];

  return (
    <main>
      <div className="mb-5 pt-2 text-center">
        <h1 className="text-2xl font-extrabold tracking-tight">Office Assistant</h1>
      </div>

      <section className="grid grid-cols-3 gap-3">
        {cards.map((card) => (
          <button
            key={card.label}
            type="button"
            onClick={card.onClick}
            disabled={!card.enabled}
            className={clsx(
              "relative rounded-2xl border p-3 shadow-sm transition dark:border-slate-700 dark:bg-slate-800",
              card.enabled
                ? "border-slate-100 bg-white hover:-translate-y-0.5 hover:shadow-md"
                : "border-slate-200 bg-slate-50 opacity-65 saturate-50 dark:bg-slate-800/70"
            )}
          >
            {!card.enabled && (
              <span className="absolute right-1 top-1 flex items-center gap-1 rounded-full border border-amber-400/50 bg-amber-300/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                <span className="animate-bounce">
                  <ComingSoonIcon />
                </span>
                준비중
              </span>
            )}
            <div
              className={clsx(
                "mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white",
                card.color
              )}
            >
              {card.icon}
            </div>
            <p className="text-sm font-bold">{card.label}</p>
          </button>
        ))}
      </section>
    </main>
  );
}
