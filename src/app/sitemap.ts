import type { MetadataRoute } from "next";
import { CONTENT_TYPES, getAllContent, type ContentItem } from "@/lib/content";
import { routing } from "@/i18n/routing";
import type { Locale } from "@/i18n/routing";

// output: "export" 要求路由显式声明静态（fs 扫描只在 build 时执行）
export const dynamic = "force-static";

type ChangeFreq = "daily" | "weekly" | "monthly";

const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL || "https://animalhospital.games";

/**
 * 把 (locale, path) 组合成绝对 URL。
 * en 是 defaultLocale，走无前缀根路径（如 /codes）；其余 locale 带 /<locale> 前缀。
 *
 * next.config.mjs 设置了 trailingSlash: true，所有线上 URL 都以 `/` 结尾，
 * canonical 标签和实际服务的 URL 一致。sitemap 里的 URL 必须保持同样的形态，
 * 否则 Google 会把 sitemap 里的无斜杠 URL 与 canonical 里的带斜杠 URL 当成两个不同页面，
 * 新站收录会变慢。参考：https://fifa-super-soccer.art/sitemap.xml
 */
function urlFor(locale: Locale, path: string): string {
  const prefix = locale === "en" ? "" : `/${locale}`;
  // "/" -> "/", "/codes" -> "/codes/", "/codes/slug" -> "/codes/slug/"
  const normalizedPath = path === "/" ? "/" : path.endsWith("/") ? path : `${path}/`;
  return `${siteUrl()}${prefix}${normalizedPath}`;
}

/** 把 metadata.date 转成 Date，无法解析时回退到当前时间 */
function toDate(value: string | undefined, fallback: Date): Date {
  if (!value) return fallback;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? fallback : d;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const locales = routing.locales;

  // 预扫描：contentByCategory[category][locale] = 该 locale 该分类下的文章列表。
  // 用于只在确有内容的 locale/分类下输出 URL，避免索引空列表页或 404。
  const contentByCategory: Partial<Record<string, Partial<Record<Locale, ContentItem[]>>>> = {};
  for (const locale of locales) {
    for (const category of CONTENT_TYPES) {
      const items = await getAllContent(category, locale);
      if (items.length === 0) continue;
      (contentByCategory[category] ??= {})[locale] = items;
    }
  }

  const entries: MetadataRoute.Sitemap = [];

  // 1) 首页（所有 locale 都有）
  for (const locale of locales) {
    entries.push({
      url: urlFor(locale, "/"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    });
  }

  // 2) 分类根 + 文章内页
  for (const category of CONTENT_TYPES) {
    const byLocale = contentByCategory[category];
    if (!byLocale) continue;

    const localesWithCategory = locales.filter((l) => byLocale[l]?.length);
    if (localesWithCategory.length === 0) continue;

    // 分类根
    for (const locale of localesWithCategory) {
      entries.push({
        url: urlFor(locale, `/${category}`),
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.9,
      });
    }

    // 文章内页：取该分类下所有 locale 出现过的 slug 并集
    const slugSet = new Set<string>();
    for (const locale of localesWithCategory) {
      for (const item of byLocale[locale] ?? []) slugSet.add(item.slug);
    }

    for (const slug of slugSet) {
      const path = `/${category}/${slug}`;
      for (const locale of localesWithCategory) {
        const item = byLocale[locale]?.find((i) => i.slug === slug);
        if (!item) continue;
        entries.push({
          url: urlFor(locale, path),
          lastModified: toDate(item.metadata.date, now),
          changeFrequency: "weekly",
          priority: 0.7,
        });
      }
    }
  }

  // 3) 工具页（所有 locale 都有）
  const toolPages = ["/tools", "/tools/credits-calculator", "/tools/weapon-comparison", "/tools/loadout-planner"];
  for (const path of toolPages) {
    for (const locale of locales) {
      entries.push({
        url: urlFor(locale, path),
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  }

  // 4) 法律页（所有 locale 都有）
  const legalPages = ["/about", "/copyright", "/privacy-policy", "/terms-of-service", "/contact"];
  for (const path of legalPages) {
    for (const locale of locales) {
      entries.push({
        url: urlFor(locale, path),
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.3,
      });
    }
  }

  return entries;
}
