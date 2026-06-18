import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { VideoPlayer } from "@/components/admin/VideoPlayer";

const DAYS: Record<
  string,
  { title: string; videoSrc: string; aspectRatio?: string }
> = {
  "1": {
    title: "Ден 1",
    videoSrc: "", // замени с реален URL
    aspectRatio: "9/16",
  },
  // добави останалите дни тук
};

export default async function OnboardingDayPage({
  params,
}: {
  params: Promise<{ day: string }>;
}) {
  const { day } = await params;
  const lesson = DAYS[day];
  if (!lesson) notFound();

  return (
    <div className="admin-page-shell max-w-lg">
      <Link
        href="/admin/onboarding"
        className="mb-4 inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900"
      >
        <ChevronLeft size={16} />
        Обратно
      </Link>

      <h1
        className="mb-6 text-2xl font-black tracking-tight text-[#1A1A1A]"
        style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
      >
        {lesson.title}
      </h1>

      {lesson.videoSrc ? (
        <VideoPlayer src={lesson.videoSrc} aspectRatio={lesson.aspectRatio} />
      ) : (
        <div
          className="flex items-center justify-center rounded-xl bg-neutral-200 text-neutral-400"
          style={{ aspectRatio: lesson.aspectRatio ?? "9/16" }}
        >
          Видеото не е качено
        </div>
      )}

      <MarkCompleteButton day={day} />
    </div>
  );
}

function MarkCompleteButton({ day }: { day: string }) {
  return (
    <form className="mt-6">
      <input type="hidden" name="day" value={day} />
      <button
        type="submit"
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white px-4 py-4 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-full border border-neutral-400" />
        Маркирай като завършен
      </button>
    </form>
  );
}
