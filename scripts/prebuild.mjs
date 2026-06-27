/**
 * Cloudflare Pages prebuild script.
 *
 * 为什么需要这个脚本：
 * Next.js 15 不允许 `output: "export"` 与 `src/middleware.ts` 同时存在
 * （会报 "Middleware cannot be used with output: export"）。
 *
 * 但 dev 模式又必须依赖 middleware 才能让 next-intl 的 localePrefix: "as-needed"
 * 把 `/items` 重写为 `/en/items`。
 *
 * 解决办法：build 前把 middleware.ts 暂时改名禁用，postbuild 脚本里会恢复。
 *
 * 配合 next.config.mjs 里 `STATIC_EXPORT === "1"` 条件启用 output: "export"。
 *
 * 运行：`npm run build` 会自动先调用本脚本。
 */

import { renameSync, existsSync } from "node:fs";
import { join } from "node:path";

const MW_PATH = join("src", "middleware.ts");
const MW_DISABLED = join("src", "middleware.ts.disabled");

if (existsSync(MW_PATH)) {
  renameSync(MW_PATH, MW_DISABLED);
  console.log("[prebuild] middleware.ts → middleware.ts.disabled（与 output: export 不兼容）");
} else if (existsSync(MW_DISABLED)) {
  console.log("[prebuild] middleware.ts 已处于禁用状态，无需操作");
} else {
  console.warn("[prebuild] 警告：未找到 middleware.ts，dev 模式 i18n 路由可能异常");
}
