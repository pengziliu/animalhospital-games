import createNextIntlPlugin from "next-intl/plugin";
import createMDX from "@next/mdx";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const withMDX = createMDX({
  options: {
    remarkPlugins: [remarkGfm],
    // rehype-slug 用 github-slugger 给 ## / ### 自动生成 id，
    // 支持 CJK（中文/日文等）字符，避免全中文标题 id 变成空串。
    // TOC 组件依赖这些 id 做锚点跳转。
    rehypePlugins: [rehypeSlug],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cloudflare Pages 静态导出 — 仅在 build 时通过 STATIC_EXPORT=1 启用。
  // dev 模式不设置 output: "export"，这样 src/middleware.ts 可以正常工作，
  // 让 next-intl 的 localePrefix: "as-needed" 能在 dev server 里把 /items
  // 正确重写为 /en/items。
  ...(process.env.STATIC_EXPORT === "1" ? { output: "export" } : {}),
  // 目录式 URL，便于 Cloudflare Pages 解析 /bosses -> /bosses/index.html
  trailingSlash: true,
  pageExtensions: ["ts", "tsx", "js", "jsx", "md", "mdx"],
  allowedDevOrigins: ["*.preview.same-app.com"],
  images: {
    // 静态导出必须关闭优化
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "source.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "ext.same-assets.com", pathname: "/**" },
      { protocol: "https", hostname: "ugc.same-assets.com", pathname: "/**" },
      { protocol: "https", hostname: "img.youtube.com", pathname: "/**" },
      { protocol: "https", hostname: "i.ytimg.com", pathname: "/**" },
    ],
  },
};

export default withNextIntl(withMDX(nextConfig));
