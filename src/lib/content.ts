import fs from "fs";
import path from "path";
import GithubSlugger from "github-slugger";
import { CONTENT_TYPES as CONFIG_CONTENT_TYPES } from "@/config/navigation";
import { routing, type Locale } from "@/i18n/routing";

// 从统一配置导入内容类型
export const CONTENT_TYPES = CONFIG_CONTENT_TYPES;

// 共享 slugger 实例（与 rehype-slug 保持一致的 id 生成逻辑，
// 这样 extractHeadings 产出的 id 和 MDX 渲染后 DOM 上的 id 完全一致，
// TOC 锚点跳转才能正常工作）
const slugger = new GithubSlugger();

/**
 * 将文件名转换为 URL-safe slug
 * 所有非字母数字连字符下划线的字符（冒号、问号、井号、空格等）替换为 -
 * 合并连续的 -，去掉首尾 -
 */
export function fileNameToSlug(fileName: string): string {
  return fileName
    .replace(/\.mdx$/, "")
    .replace(/[^a-zA-Z0-9\-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * 根据 slug 在目录中反查真实文件名（不含 .mdx）
 * 例如 slug="gelum-boss" → 返回 "gelum:boss"
 */
export function findFileBySlug(dir: string, slug: string, basePath: string[] = []): string | null {
  if (!fs.existsSync(dir)) return null;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const result = findFileBySlug(fullPath, slug, [...basePath, entry.name]);
      if (result) return result;
    } else if (entry.name.endsWith(".mdx")) {
      const fileName = entry.name.replace(".mdx", "");
      const entrySlug = [...basePath, fileNameToSlug(fileName)].join("/");
      if (entrySlug === slug) {
        return [...basePath, fileName].join("/");
      }
    }
  }
  return null;
}

// 通用 Metadata 接口（与 MDX 文件 export const metadata 对应）
export interface ContentMetadata {
  title: string;
  description: string;
  category: string;
  date: string;
  lastModified?: string;
  image?: string;
  badge?: string;
  summary?: string;
}

// Heading 结构（从 MDX 源文件提取）
export interface Heading {
  id: string;
  text: string;
  level: number;
}

// 内容项接口
export interface ContentItem {
  slug: string;
  segments: string[];
  contentType: string;
  locale: Locale;
  metadata: ContentMetadata;
}

// 内容数据接口（含 MDX 组件）
export type ContentData = {
  slug: string;
  segments: string[];
  contentType: string;
  locale: Locale;
  metadata: ContentMetadata;
  MDXContent: React.ComponentType;
  headings: Heading[];
};

const CONTENT_ROOT = path.join(process.cwd(), "content");

/**
 * 从 MDX 源文件中提取 ## 和 ### 标题
 *
 * 必须与 MDX 渲染时 rehype-slug 生成的 id 完全一致，
 * 否则 TOC 锚点跳转会失效。rehype-slug 内部用 github-slugger：
 *   - 保留中文/日文等 CJK 字符
 *   - 小写、空格转 -
 *   - 同名标题自动加 -1/-2 后缀
 * 每次提取前 reset()，保证与 rehype-slug 单文档处理范围一致。
 */
function extractHeadings(mdxSource: string): Heading[] {
  const headings: Heading[] = [];
  const lines = mdxSource.split("\n");
  slugger.reset();
  for (const line of lines) {
    const match = line.match(/^(#{2,3})\s+(.+)/);
    if (match) {
      const level = match[1].length;
      // 去掉 MDX 末尾可能的 {#xxx} 显式 id 语法，再 trim
      const text = match[2].replace(/\{[^}]*\}/g, "").trim();
      const id = slugger.slug(text);
      headings.push({ id, text, level });
    }
  }
  return headings;
}

/**
 * 读取 MDX 源文件并提取 headings
 */
function getHeadingsFromFile(filePath: string): Heading[] {
  try {
    const source = fs.readFileSync(filePath, "utf-8");
    return extractHeadings(source);
  } catch {
    return [];
  }
}

/**
 * 辅助函数：递归获取目录下所有 MDX 文件的 slug 路径
 */
function getSlugsFromDirectory(dir: string, basePath: string[] = []): string[][] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const paths: string[][] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      paths.push(...getSlugsFromDirectory(fullPath, [...basePath, entry.name]));
    } else if (entry.name.endsWith(".mdx")) {
      const fileName = entry.name.replace(".mdx", "");
      paths.push([...basePath, fileNameToSlug(fileName)]);
    }
  }
  return paths;
}

/**
 * 获取所有内容列表（支持递归读取嵌套目录）
 * 使用动态 import 获取 MDX 文件的 metadata
 */
export async function getAllContent(contentType: string, language: Locale): Promise<ContentItem[]> {
  const contentDir = path.join(CONTENT_ROOT, language, contentType);
  const slugPaths = getSlugsFromDirectory(contentDir);

  const items = await Promise.all(
    slugPaths.map(async (segments) => {
      const slug = segments.join("/");
      try {
        const realSlug = findFileBySlug(contentDir, slug) || slug;
        const mod = await import(`../../content/${language}/${contentType}/${realSlug}.mdx`);
        return {
          slug,
          segments,
          contentType,
          locale: language,
          metadata: mod.metadata as ContentMetadata,
        } satisfies ContentItem;
      } catch {
        return null;
      }
    }),
  );

  return items
    .filter((item): item is ContentItem => Boolean(item))
    .sort((a, b) => a.metadata.title.localeCompare(b.metadata.title));
}

/**
 * 获取单个内容项（含 MDX 渲染后的内容组件）
 * 使用动态 import 直接导入 .mdx 文件
 */
export async function getContent(contentType: string, slugSegments: string[], language: Locale): Promise<ContentData | null> {
  const currentSlug = slugSegments.join("/");
  const contentDir = path.join(CONTENT_ROOT, language, contentType);

  try {
    const realSlug = findFileBySlug(contentDir, currentSlug) || currentSlug;
    const mdxPath = path.join(contentDir, `${realSlug}.mdx`);
    const { default: MDXContent, metadata } = await import(
      `../../content/${language}/${contentType}/${realSlug}.mdx`
    );

    return {
      slug: currentSlug,
      segments: slugSegments,
      contentType,
      locale: language,
      metadata: metadata as ContentMetadata,
      MDXContent,
      headings: getHeadingsFromFile(mdxPath),
    };
  } catch {
    // Fallback 到英文
    if (language !== routing.defaultLocale) {
      try {
        const enContentDir = path.join(CONTENT_ROOT, routing.defaultLocale, contentType);
        const enRealSlug = findFileBySlug(enContentDir, currentSlug) || currentSlug;
        const enMdxPath = path.join(enContentDir, `${enRealSlug}.mdx`);
        const { default: MDXContent, metadata } = await import(
          `../../content/${routing.defaultLocale}/${contentType}/${enRealSlug}.mdx`
        );
        return {
          slug: currentSlug,
          segments: slugSegments,
          contentType,
          locale: routing.defaultLocale,
          metadata: metadata as ContentMetadata,
          MDXContent,
          headings: getHeadingsFromFile(enMdxPath),
        };
      } catch {
        return null;
      }
    }
    return null;
  }
}

/**
 * 导航分组结构（用于动态 Wiki Navigation）
 */
export interface NavGroup {
  /** 分组标题，来自目录名转人类可读格式，如 "bosses" → "Bosses" */
  title: string;
  /** 该分组下的文章数量 */
  count: number;
  /** 分组 slug（即目录名，如 "bosses"） */
  slug: string;
  /** 文章链接列表 */
  links: Array<{ label: string; href: string; badge?: string }>;
}

// 分组标题映射：slug → 人类可读标题（默认英文）
const GROUP_TITLES: Record<string, string> = {
  codes: "Codes",
  guide: "Guides",
  "tier-list": "Tier List",
  classes: "Classes",
  anomalies: "Anomalies",
  items: "Items",
  builds: "Builds",
};

// 西班牙语分组标题映射
const GROUP_TITLES_ES: Record<string, string> = {
  codes: "Códigos",
  guide: "Guías",
  "tier-list": "Tier List",
  classes: "Clases",
  anomalies: "Anomalías",
  items: "Objetos",
  builds: "Builds",
};

const GROUP_TITLES_PT: Record<string, string> = {
  codes: "Códigos",
  guide: "Guias",
  "tier-list": "Tier List",
  classes: "Classes",
  anomalies: "Anomalias",
  items: "Itens",
  builds: "Builds",
};

// 法语分组标题映射
const GROUP_TITLES_FR: Record<string, string> = {
  codes: "Codes",
  "tier-list": "Tier List",
  guide: "Guides",
  units: "Unités",
  traits: "Traits",
  gamepasses: "Gamepasses",
  updates: "Mises à jour",
};

// 日语分组标题映射
const GROUP_TITLES_JA: Record<string, string> = {
  codes: "コード",
  guide: "ガイド",
  "tier-list": "ティアリスト",
  classes: "クラス",
  anomalies: "異常",
  items: "アイテム",
  builds: "ビルド",
};

// 德语分组标题映射
const GROUP_TITLES_DE: Record<string, string> = {
  codes: "Codes",
  "tier-list": "Tier-Liste",
  guide: "Leitfäden",
  units: "Einheiten",
  traits: "Merkmale",
  gamepasses: "Gamepasses",
  updates: "Updates",
};

// 印尼语分组标题映射
const GROUP_TITLES_ID: Record<string, string> = {
  codes: "Kode",
  "tier-list": "Tier List",
  guide: "Panduan",
  units: "Unit",
  traits: "Trait",
  gamepasses: "Gamepass",
  updates: "Pembaruan",
};

// 意大利语分组标题映射
const GROUP_TITLES_IT: Record<string, string> = {
  codes: "Codici",
  "tier-list": "Tier List",
  guide: "Guide",
  units: "Unità",
  traits: "Tratti",
  gamepasses: "Gamepass",
  updates: "Aggiornamenti",
};

// 韩语分组标题映射
const GROUP_TITLES_KO: Record<string, string> = {
  codes: "코드",
  "tier-list": "티어 리스트",
  guide: "가이드",
  units: "유닛",
  traits: "특성",
  gamepasses: "게임패스",
  updates: "업데이트",
};

// 波兰语分组标题映射
const GROUP_TITLES_PL: Record<string, string> = {
  codes: "Kody",
  "tier-list": "Tier Lista",
  guide: "Poradniki",
  units: "Jednostki",
  traits: "Cechy",
  gamepasses: "Gamepassy",
  updates: "Aktualizacje",
};

// 俄语分组标题映射
const GROUP_TITLES_RU: Record<string, string> = {
  codes: "Коды",
  "tier-list": "Тир-лист",
  guide: "Руководства",
  units: "Юниты",
  traits: "Характеристики",
  gamepasses: "Игровые пропуски",
  updates: "Обновления",
};

// 简体中文分组标题映射
const GROUP_TITLES_ZH: Record<string, string> = {
  codes: "兑换码",
  "tier-list": "强度榜",
  guide: "攻略",
  units: "单位",
  traits: "特性",
  gamepasses: "游戏通行证",
  updates: "更新",
};

// 泰语分组标题映射
const GROUP_TITLES_TH: Record<string, string> = {
  codes: "รหัส",
  "tier-list": "จัดอันดับ",
  guide: "คู่มือ",
  units: "ยูนิต",
  traits: "คุณสมบัติ",
  gamepasses: "เกมพาส",
  updates: "อัปเดต",
};

// 土耳其语分组标题映射
const GROUP_TITLES_TR: Record<string, string> = {
  codes: "Kodlar",
  "tier-list": "Tier Listesi",
  guide: "Rehberler",
  units: "Birimler",
  traits: "Özellikler",
  gamepasses: "Oyun Geçişleri",
  updates: "Güncellemeler",
};

// locale → 分组标题映射
const GROUP_TITLES_BY_LOCALE: Record<string, Record<string, string>> = {
  es: GROUP_TITLES_ES,
  pt: GROUP_TITLES_PT,
  fr: GROUP_TITLES_FR,
  ja: GROUP_TITLES_JA,
  de: GROUP_TITLES_DE,
  id: GROUP_TITLES_ID,
  it: GROUP_TITLES_IT,
  ko: GROUP_TITLES_KO,
  pl: GROUP_TITLES_PL,
  ru: GROUP_TITLES_RU,
  zh: GROUP_TITLES_ZH,
  th: GROUP_TITLES_TH,
  tr: GROUP_TITLES_TR,
};

// locale → "Overview" 翻译
const OVERVIEW_LABEL_BY_LOCALE: Record<string, string> = {
  es: "Resumen",
  pt: "Visão Geral",
  fr: "Aperçu",
  ja: "概要",
  de: "Übersicht",
  id: "Ikhtisar",
  it: "Panoramica",
  ko: "개요",
  pl: "Przegląd",
  ru: "Обзор",
  zh: "概览",
  th: "ภาพรวม",
  tr: "Genel Bakış",
};

// 分组排序顺序
const GROUP_ORDER: string[] = [
  "guide", "codes", "tier-list", "classes", "anomalies", "items", "builds",
];

/**
 * 动态生成 Wiki Navigation 分组
 * 扫描 content/<locale>/ 下的所有 MDX 文件，按子目录分组
 * 同时为列表页添加 Overview 入口
 */
export function getDynamicNavigation(language: Locale = "en"): NavGroup[] {
  const localeDir = path.join(CONTENT_ROOT, language);
  if (!fs.existsSync(localeDir)) return [];

  const entries = fs.readdirSync(localeDir, { withFileTypes: true });
  const groups: NavGroup[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const groupSlug = entry.name;
    // 跳过不在 CONTENT_TYPES 中的目录，避免显示会 404 的导航链接
    if (!CONTENT_TYPES.includes(groupSlug as typeof CONTENT_TYPES[number])) continue;
    const groupDir = path.join(localeDir, groupSlug);
    const slugPaths = getSlugsFromDirectory(groupDir);

    if (slugPaths.length === 0) continue;

    const links: NavGroup["links"] = [];
    // 添加 Overview 入口（按 locale 翻译）
    const overviewLabel = OVERVIEW_LABEL_BY_LOCALE[language] || "Overview";
    links.push({ label: overviewLabel, href: `/${groupSlug}` });

    for (const segments of slugPaths) {
      const articleSlug = segments.join("/");
      const mdxFilePath = findFileBySlug(groupDir, articleSlug);
      if (!mdxFilePath) continue;

      const fullPath = path.join(groupDir, `${mdxFilePath}.mdx`);
      let title = segments[segments.length - 1].replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      let badge: string | undefined;

      try {
        const source = fs.readFileSync(fullPath, "utf-8");
        // 提取 metadata.title
        const titleMatch = source.match(/title:\s*["'](.+?)["']/);
        if (titleMatch) title = titleMatch[1];
        // 提取 metadata.badge
        const badgeMatch = source.match(/badge:\s*["'](.+?)["']/);
        if (badgeMatch) badge = badgeMatch[1];
      } catch {
        // 读取失败用默认标题
      }

      links.push({ label: title, href: `/${groupSlug}/${articleSlug}`, badge });
    }

    // 优先使用 locale 特定标题，否则回退到英文默认
    const localTitles = GROUP_TITLES_BY_LOCALE[language] || {};
    const groupTitle = localTitles[groupSlug] || GROUP_TITLES[groupSlug] || groupSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

    groups.push({
      title: groupTitle,
      count: links.length - 1, // 减去 Overview
      slug: groupSlug,
      links,
    });
  }

  // 按 GROUP_ORDER 排序
  groups.sort((a, b) => {
    const ai = GROUP_ORDER.indexOf(a.slug);
    const bi = GROUP_ORDER.indexOf(b.slug);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  return groups;
}

/**
 * 获取所有内容路径（用于 generateStaticParams）
 */
export async function getAllContentPaths(language: Locale) {
  const localeDir = path.join(CONTENT_ROOT, language);
  if (!fs.existsSync(localeDir)) return [];

  const entries = fs.readdirSync(localeDir, { withFileTypes: true });
  const contentTypeDirs = entries.filter((entry) => entry.isDirectory());

  const paths = contentTypeDirs.flatMap((entry) => {
    const segments = getSlugsFromDirectory(path.join(localeDir, entry.name));
    return segments.map((slug) => ({ contentType: entry.name, slug }));
  });

  return paths;
}
