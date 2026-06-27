import Script from "next/script";

/**
 * Google Analytics 4 (gtag.js)
 *
 * GA ID 优先读 NEXT_PUBLIC_GOOGLE_ANALYTICS_ID 环境变量，
 * 否则使用默认 ID（G-MVFVFXMQQH）。
 *
 * 使用 next/script 的 afterInteractive 策略，静态导出（output: export）
 * 时脚本会被直接嵌进生成的 HTML。
 */
const GA_ID = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID || "G-SGQQ3GC5DN";

export function GoogleAnalytics() {
  if (!GA_ID) return null;
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}
      </Script>
    </>
  );
}
