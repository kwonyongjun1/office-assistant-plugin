import type { ReactNode } from "react";

function IconFrame({ children }: { children: ReactNode }) {
  return <span className="h-5 w-5">{children}</span>;
}

export function BriefcaseIcon() {
  return (
    <IconFrame>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      </svg>
    </IconFrame>
  );
}

export function ClockIcon() {
  return (
    <IconFrame>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v5l3 2" />
      </svg>
    </IconFrame>
  );
}

export function CheckIcon() {
  return (
    <IconFrame>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <path d="m8 12 3 3 5-6" />
      </svg>
    </IconFrame>
  );
}

export function DocumentIcon() {
  return (
    <IconFrame>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M7 3h7l5 5v13H7z" />
        <path d="M14 3v6h5" />
        <path d="M10 13h6M10 17h6" />
      </svg>
    </IconFrame>
  );
}

export function CalendarIcon() {
  return (
    <IconFrame>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M8 3v4M16 3v4M3 10h18" />
      </svg>
    </IconFrame>
  );
}

export function MailIcon() {
  return (
    <IconFrame>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m4 7 8 6 8-6" />
      </svg>
    </IconFrame>
  );
}

export function ChartIcon() {
  return (
    <IconFrame>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M5 19V9M12 19V5M19 19v-7" />
        <path d="M3 19h18" />
      </svg>
    </IconFrame>
  );
}

export function FolderIcon() {
  return (
    <IconFrame>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 7h6l2 2h10v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      </svg>
    </IconFrame>
  );
}

export function MessageIcon() {
  return (
    <IconFrame>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 5h16v10H9l-5 4z" />
      </svg>
    </IconFrame>
  );
}

export function TargetIcon() {
  return (
    <IconFrame>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
      </svg>
    </IconFrame>
  );
}

export function ComingSoonIcon() {
  return (
    <IconFrame>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />
        <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
      </svg>
    </IconFrame>
  );
}

export function SunIcon() {
  return (
    <IconFrame>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    </IconFrame>
  );
}

export function MoonIcon() {
  return (
    <IconFrame>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4 7 7 0 0 0 20 14.5Z" />
      </svg>
    </IconFrame>
  );
}
