import Link from "next/link";
import { PlayCircle } from "lucide-react";

const DAYS = [
  { day: "1", title: "Ден 1", duration: "15:46" },
  // добави останалите дни
];

export default function OnboardingIndexPage() {
  return (
    <div className="admin-page-shell max-w-lg">
      <h1
        className="mb-6 text-2xl font-black tracking-tight text-[#1A1A1A]"
        style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
      >
        Обучение
      </h1>

      <ul className="flex flex-col gap-3">
        {DAYS.map(({ day, title, duration }) => (
          <li key={day}>
            <Link
              href={`/admin/onboarding/${day}`}
              className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-white px-4 py-4 hover:bg-neutral-50 transition-colors"
            >
              <PlayCircle size={24} className="shrink-0 text-neutral-400" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[#1A1A1A]">{title}</p>
                <p className="text-xs text-neutral-400">{duration}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
