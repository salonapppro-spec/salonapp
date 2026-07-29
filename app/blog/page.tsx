import type { Metadata } from "next";
import Link from "next/link";
import { Playfair_Display } from "next/font/google";
import LandingHeader from "@/components/landing/LandingHeader";
import BlogFooter from "@/components/blog/BlogFooter";
import { getAllPostMeta } from "@/lib/blog";

const playfair = Playfair_Display({
  subsets: ["latin", "cyrillic"],
  weight: ["700", "800", "900"],
  variable: "--font-playfair",
});

const BASE_URL = "https://salonapp.pro";

export const metadata: Metadata = {
  title: "Блог за салони — съвети за резервации, клиенти и растеж | SalonApp",
  description:
    "Практични съвети за собственици на салони: онлайн резервации, намаляване на неявявания, управление на клиенти и растеж на бизнеса.",
  alternates: { canonical: `${BASE_URL}/blog` },
  openGraph: {
    title: "Блог за салони | SalonApp.pro",
    description:
      "Практични съвети за собственици на салони — резервации, клиенти и растеж на бизнеса.",
    url: `${BASE_URL}/blog`,
    siteName: "SalonApp.pro",
    locale: "bg_BG",
    type: "website",
  },
};

function formatDate(iso: string): string {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("bg-BG", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function BlogIndexPage() {
  const posts = getAllPostMeta();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Блог на SalonApp",
    url: `${BASE_URL}/blog`,
    description:
      "Практични съвети за собственици на салони — резервации, клиенти и растеж.",
    publisher: {
      "@type": "Organization",
      name: "SalonApp.pro",
      url: BASE_URL,
    },
    blogPost: posts.map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      description: p.description,
      datePublished: p.date,
      url: `${BASE_URL}/blog/${p.slug}`,
    })),
  };

  return (
    <div className={`${playfair.variable} min-h-screen bg-[#F8EBDD]`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingHeader />

      <main className="mx-auto max-w-5xl px-6 pb-24 pt-32 lg:px-8">
        {/* Hero */}
        <header className="mb-14 text-center">
          <p className="mb-3 text-[11px] font-black uppercase tracking-[0.3em] text-[#C79A4B]">
            Блог
          </p>
          <h1
            className="mx-auto max-w-3xl text-4xl font-black leading-tight text-[#3D1F0A] sm:text-5xl"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            Съвети за собственици на салони
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-[#6E6A63]">
            Как да пълниш графика, да задържаш клиенти и да развиваш салона си —
            без хаос и без изгубени часове.
          </p>
        </header>

        {/* Posts */}
        {posts.length === 0 ? (
          <p className="text-center text-[#6E6A63]">Скоро очаквай първите статии.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group flex flex-col rounded-2xl border border-[#E8DDD0] bg-white/60 p-7 shadow-card transition hover:-translate-y-0.5 hover:border-[#C79A4B] hover:shadow-card-lg"
              >
                {post.tags[0] && (
                  <span className="mb-3 w-fit rounded-full bg-[#F5EBE4] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-[#B36B52]">
                    {post.tags[0]}
                  </span>
                )}
                <h2
                  className="text-xl font-bold leading-snug text-[#3D1F0A] transition group-hover:text-[#B36B52]"
                  style={{ fontFamily: "var(--font-playfair)" }}
                >
                  {post.title}
                </h2>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-[#6E6A63]">
                  {post.description}
                </p>
                <div className="mt-5 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#6E6A63]/70">
                  <time dateTime={post.date}>{formatDate(post.date)}</time>
                  <span aria-hidden>·</span>
                  <span>{post.readingMinutes} мин четене</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <BlogFooter />
    </div>
  );
}
