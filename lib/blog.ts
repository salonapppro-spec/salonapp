/**
 * lib/blog.ts — B2B блог за salonapp.pro
 *
 * Съдържанието са markdown файлове в `content/blog/*.md` с frontmatter.
 * Чете се server-side (файлова система), рендира се статично за максимално SEO.
 *
 * Frontmatter формат:
 * ---
 * title: "Заглавие на статията"
 * description: "Meta описание (150–160 символа)"
 * date: "2026-07-29"
 * author: "Екипът на SalonApp"
 * tags: ["резервации", "маркетинг"]
 * cover: "/blog/covers/example.webp"   # по избор
 * ---
 */
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

export interface BlogMeta {
  slug: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  author: string;
  tags: string[];
  cover: string | null;
  readingMinutes: number;
}

export interface BlogPost extends BlogMeta {
  html: string;
}

marked.setOptions({ gfm: true, breaks: false });

function readingMinutes(markdown: string): number {
  const words = markdown.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

function toMeta(
  data: Record<string, unknown>,
  slug: string,
  content: string
): BlogMeta {
  return {
    slug,
    title: String(data.title ?? slug),
    description: String(data.description ?? ""),
    date: String(data.date ?? ""),
    author: String(data.author ?? "Екипът на SalonApp"),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    cover: data.cover ? String(data.cover) : null,
    readingMinutes: readingMinutes(content),
  };
}

/** Всички slug-ове (за generateStaticParams). */
export function getPostSlugs(): string[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
}

/** Мета данни за всички статии, сортирани по дата (най-нови най-отгоре). */
export function getAllPostMeta(): BlogMeta[] {
  return getPostSlugs()
    .map((slug) => {
      const raw = fs.readFileSync(path.join(BLOG_DIR, `${slug}.md`), "utf8");
      const { data, content } = matter(raw);
      return toMeta(data, slug, content);
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

/** Една статия с рендиран HTML, или null ако не съществува. */
export function getPost(slug: string): BlogPost | null {
  const file = path.join(BLOG_DIR, `${slug}.md`);
  if (!fs.existsSync(file)) return null;
  const raw = fs.readFileSync(file, "utf8");
  const { data, content } = matter(raw);
  const html = marked.parse(content) as string;
  return { ...toMeta(data, slug, content), html };
}
