/**
 * Cloudflare Pages postbuild script.
 *
 * 为什么需要这个脚本：
 * next-intl 用 `localePrefix: "as-needed"` 时，英文应走根路径（如 `/codes`），
 * 但 Next.js 的 `[locale]` 动态路由在 `output: "export"` 模式下会强制输出
 * `out/en/**`、`out/es/**`、`out/ja/**`、`out/pt/**`、`out/fr/**` 五个目录。
 * 这个脚本把英文（默认语言）的产物复制到 `out/` 根，让英文 URL 保持无前缀结构，
 * 同时保留 `/es/**`、`/ja/**`、`/pt/**`、`/fr/**` 不变。
 *
 * 行为：
 *   - 复制 out/en/*  → out/  （保留 es/ja/pt/fr 目录，不覆盖 _next / public 资源）
 *   - 处理 trailingSlash: true 产生的 /index.html
 *   - 删除复制后残留的 out/en 目录（可选，默认保留以便访问 /en/* 不 404）
 *
 * 幂等：重复运行不会出错（覆盖同名文件）。
 *
 * 运行：`npm run build` 之后自动调用，也可手动 `node scripts/postbuild.mjs`。
 */

import { cp, readdir, rm, stat, access } from "node:fs/promises";
import { existsSync, renameSync } from "node:fs";
import { join } from "node:path";

const OUT_DIR = "out";
const EN_DIR = join(OUT_DIR, "en");
const DEFAULT_LOCALE_DIR = EN_DIR; // 与 routing.ts 的 defaultLocale 保持一致

// 这些目录/文件由 Next.js 生成或来自 public，复制时必须跳过
// （即使英文 locale 目录里有同名内容也保留根目录版本）
const PRESERVE_AT_ROOT = new Set([
  "_next",
  "es",
  "ja",
  "pt",
  "fr",
  "images",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
  "_headers",
  "_redirects",
]);

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  if (!(await exists(EN_DIR))) {
    console.warn(
      `[postbuild] 警告：未找到 ${EN_DIR}，跳过根路径复制。\n` +
        `  - 确认 defaultLocale 仍是 "en"\n` +
        `  - 确认 next.config.mjs 已设 output: "export"`,
    );
    return;
  }

  const entries = await readdir(EN_DIR);
  let copied = 0;

  for (const entry of entries) {
    if (PRESERVE_AT_ROOT.has(entry)) {
      // 跳过：保留根目录已有版本（例如根的 index.html 来自 Next 默认输出）
      // 但根 index.html 通常是 locale 选择器，我们要覆盖为英文首页
      if (entry === "index.html") {
        // 例外：覆盖根 index.html 为英文首页
      } else {
        continue;
      }
    }

    const src = join(EN_DIR, entry);
    const dst = join(OUT_DIR, entry);

    const rootHas = await exists(dst);
    if (rootHas && !PRESERVE_AT_ROOT.has(entry)) {
      // 覆盖前先删目标（cp 在目录非空时可能失败）
      await rm(dst, { recursive: true, force: true });
    }

    await cp(src, dst, { recursive: true, force: true });
    copied++;
  }

  console.log(`[postbuild] 复制英文产物到根路径完成：${copied} 项`);

  // 验证关键文件
  const checks = [
    join(OUT_DIR, "index.html"),
    join(OUT_DIR, "codes", "index.html"),
    join(OUT_DIR, "es", "index.html"),
  ];
  for (const f of checks) {
    if (await exists(f)) {
      console.log(`  ✓ ${f}`);
    } else {
      console.warn(`  ✗ 缺失：${f}`);
    }
  }

  // 删除残留的 /en 目录，避免出现重复的 /en/* URL（可选行为）
  // 保留它也无妨，因为根路径已存在同样的内容，搜索引擎会通过 canonical 判定。
  await rm(EN_DIR, { recursive: true, force: true });
  console.log(`[postbuild] 已清理 ${EN_DIR}（避免重复 URL）`);

  // 恢复 middleware.ts（在 prebuild.mjs 里被改名为 middleware.ts.disabled）
  // 这样 dev 模式下 i18n 路由仍能正常工作
  const MW_DISABLED = join("src", "middleware.ts.disabled");
  const MW_PATH = join("src", "middleware.ts");
  if (existsSync(MW_DISABLED)) {
    renameSync(MW_DISABLED, MW_PATH);
    console.log("[postbuild] middleware.ts 已恢复（供 dev 模式使用）");
  }
}

main().catch((err) => {
  console.error("[postbuild] 失败：", err);
  process.exit(1);
});
