import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Playfair_Display } from "next/font/google";
import LandingHeader from "@/components/landing/LandingHeader";
import BlogFooter from "@/components/blog/BlogFooter";
import { getPost, getPostSlugs } from "@/lib/blog";

const playfair = Playfair_Display({
  subsets: ["latin", "cyrillic"],
  weight: ["700", "800", "900"],
  variable: "--font-playfair",
});

const BASE_URL = "https://salonapp.pro";

export function generateStaticParams() {
  return getPostSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "Статията не е намерена | SalonApp" };

  const url = `${BASE_URL}/blog/${post.slug}`;
  return {
    title: `${post.title} | SalonApp`,
    description: post.description,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.description,
      url,
      siteName: "SalonApp.pro",
      locale: "bg_BG",
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

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

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const url = `${BASE_URL}/blog/${post.slug}`;

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    author: { "@type": "Organization", name: post.author, url: BASE_URL },
    publisher: {
      "@type": "Organization",
      name: "SalonApp.pro",
      url: BASE_URL,
      logo: { "@type": "ImageObject", url: `${BASE_URL}/logo2.png` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Начало", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "Блог", item: `${BASE_URL}/blog` },
      { "@type": "ListItem", position: 3, name: post.title, item: url },
    ],
  };

  return (
    <div className={`${playfair.variable} min-h-screen bg-[#F8EBDD]`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <LandingHeader />

      <main className="mx-auto max-w-3xl px-6 pb-24 pt-32 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#6E6A63]/70">
          <Link href="/blog" className="transition hover:text-[#C79A4B]">
            ← Блог
          </Link>
        </nav>

        {/* Header */}
        <header className="mb-10">
          {post.tags[0] && (
            <span className="mb-4 inline-block rounded-full bg-[#F5EBE4] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-[#B36B52]">
              {post.tags[0]}
            </span>
          )}
          <h1
            className="text-3xl font-black leading-tight text-[#3D1F0A] sm:text-4xl"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            {post.title}
          </h1>
          <div className="mt-5 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#6E6A63]/70">
            <span>{post.author}</span>
            <span aria-hidden>·</span>
            <time dateTime={post.date}>{formatDate(post.date)}</time>
            <span aria-hidden>·</span>
            <span>{post.readingMinutes} мин четене</span>
          </div>
        </header>

        {/* Body */}
        <article
          className="prose prose-neutral max-w-none prose-headings:font-bold prose-headings:text-[#3D1F0A] prose-p:text-[#4A443D] prose-a:text-[#B36B52] prose-a:no-underline hover:prose-a:underline prose-strong:text-[#3D1F0A] prose-li:text-[#4A443D]"
          dangerouslySetInnerHTML={{ __html: post.html }}
        />

        {/* CTA */}
        <aside className="mt-14 rounded-2xl border border-[#E8DDD0] bg-white/60 p-8 text-center shadow-card">
          <h2
            className="text-2xl font-bold text-[#3D1F0A]"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            Готов да пробваш SalonApp?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-[#6E6A63]">
            Собствен сайт с онлайн резервации за салона ти. Настройка за 15 минути,
            без карта и без ангажимент.
          </p>
          <Link
            href="/get-started"
            className="mt-6 inline-block bg-[#C79A4B] px-7 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-white transition hover:bg-[#A6823A]"
          >
            Започни безплатно
          </Link>
        </aside>
      </main>

      <BlogFooter />
    </div>
  );
}
