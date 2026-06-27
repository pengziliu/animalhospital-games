import type { Metadata } from "next";
import { getMessages, setRequestLocale } from "next-intl/server";
import { JsonLd, WikiSidebar } from "@/components/site";
import { getAllContent, getDynamicNavigation, type ContentItem, CONTENT_TYPES } from "@/lib/content";
import { routing, type Locale } from "@/i18n/routing";
import en from "@/locales/en.json";
import HomePageClient from "./HomePageClient";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://animalhospital.games";

type Messages = typeof en;

/** 首页 hreflang：所有 locale 的根路径 */
function homeLanguageAlternates() {
  return Object.fromEntries(routing.locales.map((locale) => [locale, locale === "en" ? "/" : `/${locale}`]));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const messages = (await getMessages({ locale })) as Messages;
  return {
    title: messages.home.meta.title,
    description: messages.home.meta.description,
    alternates: { canonical: locale === "en" ? "/" : `/${locale}`, languages: homeLanguageAlternates() },
    openGraph: { title: messages.home.meta.title, description: messages.home.meta.description, url: siteUrl, images: [`${siteUrl}/images/hero.webp`] },
  };
}

export default async function LocaleHomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  // 告知 next-intl 当前 locale，使页面可静态预渲染
  setRequestLocale(locale);
  const loc = locale as Locale;
  const messages = (await getMessages({ locale })) as Messages;
  const navGroups = getDynamicNavigation(loc);
  const webSite = { "@context": "https://schema.org", "@type": "WebSite", name: "Animal Hospital Wiki", url: siteUrl, description: messages.home.meta.description };

  // 动态加载所有 content 目录下的文章
  const allArticles: ContentItem[] = [];
  for (const contentType of CONTENT_TYPES) {
    const items = await getAllContent(contentType, loc);
    allArticles.push(...items);
  }

  // 取最近更新的 8 篇文章（按 date 倒序）
  const recentArticles = [...allArticles]
    .sort((a, b) => {
      const dateA = a.metadata.lastModified || a.metadata.date;
      const dateB = b.metadata.lastModified || b.metadata.date;
      return dateB.localeCompare(dateA);
    })
    .slice(0, 8);

  return (
    <main className="mx-auto max-w-6xl px-4 pb-10 sm:px-6 lg:px-8">
      <JsonLd data={webSite} />
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
        <HomePageClient home={messages.home} locale={locale} articles={allArticles} recentArticles={recentArticles} />
        <WikiSidebar locale={locale} navGroups={navGroups} />
      </div>
    </main>
  );
}
