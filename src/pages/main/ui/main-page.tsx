import type { ThemeName } from "@/features/theme/model/use-theme";
import { ThemeToggle } from "@/features/theme/ui/theme-toggle";
import type { AppRoute } from "@/shared/lib/routing/hash-route";
import {
  CalendarIcon,
  ChartIcon,
  CheckIcon,
  ClockIcon,
  DocumentIcon,
  FolderIcon,
  MailIcon,
  MessageIcon,
  TargetIcon,
} from "@/shared/ui/icons";

type MainPageProps = {
  onNavigate: (route: AppRoute) => void;
  theme: ThemeName;
  themeAnimating: boolean;
  onToggleTheme: () => void;
};

export function MainPage({ onNavigate, theme, themeAnimating, onToggleTheme }: MainPageProps) {
  const cards = [
    {
      label: "월간 근태현황",
      color: "from-emerald-500 to-green-500",
      icon: <CalendarIcon />,
      onClick: () => onNavigate("excel-job"),
    },
    { label: "시간 관리", color: "from-sky-500 to-blue-500", icon: <ClockIcon /> },
    { label: "메모", color: "from-amber-500 to-orange-500", icon: <DocumentIcon /> },
    { label: "일정 관리", color: "from-fuchsia-500 to-pink-500", icon: <CheckIcon /> },
    { label: "이메일 템플릿", color: "from-rose-500 to-red-500", icon: <MailIcon /> },
    { label: "생산성 분석", color: "from-indigo-500 to-blue-500", icon: <ChartIcon /> },
    { label: "문서 관리", color: "from-cyan-500 to-teal-500", icon: <FolderIcon /> },
    { label: "빠른 메시지", color: "from-violet-500 to-purple-500", icon: <MessageIcon /> },
    { label: "목표 설정", color: "from-pink-500 to-fuchsia-500", icon: <TargetIcon /> },
  ];

  return (
    <main className="relative">
      <div className="mb-5 flex items-start justify-between">
        <div className="mx-auto pt-2 text-center">
          <h1 className="text-2xl font-extrabold tracking-tight">Office Assistant</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">필요한 기능을 선택하세요</p>
        </div>

        <ThemeToggle theme={theme} themeAnimating={themeAnimating} onToggle={onToggleTheme} />
      </div>

      <section className="grid grid-cols-3 gap-3">
        {cards.map((card) => (
          <button
            key={card.label}
            type="button"
            onClick={card.onClick}
            className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
          >
            <div
              className={`mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${card.color} text-white`}
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
