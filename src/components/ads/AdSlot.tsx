/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";
import { useEffect, useRef, useState } from "react";

/**
 * AdSterra 广告组件 — sandbox iframe 隔离 + 无填充自动折叠 + 明显关闭按钮
 *
 * 设计原则：
 *   1. 所有广告通过 /ads/banner-frame.html 加载（document.write 同步模式）
 *   2. 无填充 7s 自动折叠（消除空白方块）
 *   3. 所有广告都带"明显可关闭"的圆形 × 按钮（右上角 -top-3 -right-3）
 *   4. SidebarAds 紧贴 main 内容区两侧（不挡内容），仅 ≥1648px 屏幕显示
 *   5. StickyBanner 不再 sticky 悬浮，改为固定在文章标题下方
 */

// ── 广告总开关：设为 false 时所有广告组件不渲染 ──
// 后续配置好 AdSterra key 后改为 true 即可
const AD_ENABLED = true;

// ── AdSterra 广告 key（animalhospital.games 专属）──
const AD_KEYS: Record<string, any> = {
  "320x50": { key: "efcc8797070f632314c95a731fcb788e", width: 320, height: 50 },
  "300x250": { key: "ba55590ef0c82829d314caf25c0cd920", width: 300, height: 250 },
  "160x300": { key: "e015c9c4797fa9d8e70fd8b60a59c0e3", width: 160, height: 300 },
  "160x600": { key: "05d98656a014ad44e7a33e0c7b9fa19a", width: 160, height: 600 },
  "468x60": { key: "4ab1db0599892137ae11d3e71d0b719c", width: 468, height: 60 },
  "728x90": { key: "da856cd22bf80ea172c264d4b8fbcff1", width: 728, height: 90 },
  native: {
    src: "https://pl30157217.effectivecpmnetwork.com/3a37a38cd22e73048520c27db9068229/invoke.js",
    containerId: "3a37a38cd22e73048520c27db9068229",
  },
};

const HPF_BASE = "https://www.highperformanceformat.com";

/**
 * 构造 banner-frame.html URL —— 统一通过 banner-frame.html 加载广告。
 */
function buildBannerFrameUrl(type: keyof typeof AD_KEYS): string {
  const cfg = AD_KEYS[type];
  if (type === "native") {
    return `/ads/banner-frame.html?mode=native&containerId=${encodeURIComponent(cfg.containerId)}&src=${encodeURIComponent(cfg.src)}`;
  }
  const invokeSrc = `${HPF_BASE}/${cfg.key}/invoke.js`;
  return `/ads/banner-frame.html?mode=banner&key=${cfg.key}&format=iframe&h=${cfg.height}&w=${cfg.width}&src=${encodeURIComponent(invokeSrc)}`;
}

// ════════════════════════════════════════════════════════════
//  无填充自动折叠 Hook — 同时管理"加载完成才显示"的 revealed 状态
//  - revealed=false 时父容器 maxHeight: 0，iframe 被裁剪不可见（但浏览器仍加载）
//  - 检测到广告内容 → setRevealed(true) → 父容器恢复正常高度
//  - 7s 仍无内容 → setCollapsed(true) → 整体卸载
//  - 检查时机：onLoad 后立即 + 500/1500/3000/5000ms 多轮（更早发现填充）
// ════════════════════════════════════════════════════════════
function useCollapseOnNoFill(src: string) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    let filled = false;
    let started = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const check = () => {
      if (filled) return;
      try {
        const doc = iframe.contentDocument;
        if (!doc) {
          filled = true;
          setRevealed(true);
          return;
        }
        const body = doc.body;
        if (!body) return;
        if (body.querySelectorAll("iframe, img, a[href], canvas, video").length > 0) {
          filled = true;
          setRevealed(true);
          return;
        }
        const containers = body.querySelectorAll('div[id^="container-"]');
        for (let i = 0; i < containers.length; i++) {
          if (containers[i].children.length > 0) {
            filled = true;
            setRevealed(true);
            return;
          }
        }
      } catch {
        filled = true;
        setRevealed(true);
      }
    };

    const startChecks = () => {
      if (started) return;
      started = true;
      check();
      [500, 1500, 3000, 5000].forEach((d) => timers.push(setTimeout(check, d)));
      timers.push(
        setTimeout(() => {
          if (!filled) setCollapsed(true);
        }, 7000)
      );
    };

    const onLoad = () => startChecks();
    iframe.addEventListener("load", onLoad);
    timers.push(setTimeout(startChecks, 1500));

    return () => {
      iframe.removeEventListener("load", onLoad);
      timers.forEach(clearTimeout);
      filled = true;
    };
  }, [src]);

  return { iframeRef, collapsed, revealed };
}

// ════════════════════════════════════════════════════════════
//  <CloseButton> — 明显可关闭按钮（右上角圆形 ×）
//  - 28px 圆形，浅灰背景 + 边框
//  - hover 时变红底白 X（强烈视觉反馈）
//  - 同时支持键盘 Enter/Space 触发
// ════════════════════════════════════════════════════════════
function CloseButton({
  onClose,
  label = "Close advertisement",
}: {
  onClose: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClose}
      className="absolute -right-3 -top-3 grid h-7 w-7 place-items-center rounded-full border border-border bg-background text-muted-foreground shadow-md transition hover:bg-red-500 hover:text-white hover:border-red-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
      style={{ zIndex: 2 }}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M18 6 6 18M6 6l12 12" />
      </svg>
    </button>
  );
}

// ════════════════════════════════════════════════════════════
//  <AdBanner> — Banner 类广告（iframe + 无填充折叠 + 关闭按钮）
//  - 内置 hidden state：用户点 × 后 return null
//  - onCollapse：广告折叠/关闭时通知父组件（StickyBanner/SidebarAds 用）
// ════════════════════════════════════════════════════════════
export function AdBanner({
  type,
  className,
  onCollapse,
  showCloseButton = true,
}: {
  type: keyof typeof AD_KEYS;
  className?: string;
  onCollapse?: () => void;
  showCloseButton?: boolean;
}) {
  const cfg = AD_KEYS[type];
  const src = cfg && cfg.key && cfg.key !== "TBD" ? buildBannerFrameUrl(type) : "";
  const { iframeRef, collapsed, revealed } = useCollapseOnNoFill(src);
  const [hidden, setHidden] = useState(false);

  const cbRef = useRef(onCollapse);
  cbRef.current = onCollapse;
  useEffect(() => {
    if ((collapsed || hidden) && cbRef.current) cbRef.current();
  }, [collapsed, hidden]);

  if (!cfg || !cfg.key || cfg.key === "TBD" || collapsed || hidden) return null;

  return (
    <div
      className={className}
      style={{
        display: "flex",
        justifyContent: "center",
        margin: "0",
        maxHeight: revealed ? `${cfg.height}px` : 0,
        overflow: "hidden",
        transition: "max-height 0.3s ease-out",
      }}
    >
      <div style={{ position: "relative" }}>
        <iframe
          ref={iframeRef}
          src={src}
          width={cfg.width}
          height={cfg.height}
          scrolling="no"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          style={{ border: "none", display: "block" }}
          title={`advertisement-${type}`}
        />
        {showCloseButton && <CloseButton onClose={() => setHidden(true)} />}
      </div>
    </div>
  );
}

/**
 * <AdNative> — Native Banner 原生广告（iframe + 无填充折叠 + 关闭按钮）
 */
export function AdNative({ className }: { className?: string }) {
  const cfg = AD_KEYS.native;
  const src = cfg && cfg.src && cfg.src !== "TBD" ? buildBannerFrameUrl("native") : "";
  const { iframeRef, collapsed, revealed } = useCollapseOnNoFill(src);
  const [hidden, setHidden] = useState(false);

  if (!cfg || !AD_ENABLED || cfg.src === "TBD" || collapsed || hidden) return null;

  return (
    <div
      className={`hidden md:flex md:justify-center my-6 ${className ?? ""}`}
      style={{
        maxHeight: revealed ? "150px" : 0,
        overflow: "hidden",
        transition: "max-height 0.3s ease-out",
      }}
    >
      <div style={{ position: "relative" }}>
        <iframe
          ref={iframeRef}
          src={src}
          width={728}
          height={150}
          scrolling="no"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          style={{ border: "none", display: "block" }}
          title="advertisement-native"
        />
        <CloseButton onClose={() => setHidden(true)} />
      </div>
    </div>
  );
}

/**
 * <StickyBanner> — 320×50 标题下方横幅（**不再 sticky 悬浮**）
 * - 位置固定在文章标题下方，跟随内容滚动（不悬浮在视口）
 * - 带明显关闭按钮，无填充/关闭后整体隐藏
 */
export function StickyBanner() {
  const [hidden, setHidden] = useState(false);
  if (!AD_ENABLED || hidden) return null;

  return (
    <div className="py-2">
      <div className="relative mx-auto max-w-6xl">
        <AdBanner type="320x50" onCollapse={() => setHidden(true)} showCloseButton={false} />
        <CloseButton onClose={() => setHidden(true)} />
      </div>
    </div>
  );
}

/**
 * <SidebarAds> — 桌面端固定侧边栏（仅右侧 160×600）
 */
export function SidebarAds() {
  const [hidden, setHidden] = useState(false);
  if (!AD_ENABLED || hidden) return null;

  return (
    <>
      {!hidden && (
        <aside
          className="hidden min-[1264px]:block fixed top-24 z-10 overflow-visible"
          style={{ right: "max(8px, calc((100vw - 1152px) / 2 - 176px))", width: "160px" }}
        >
          <AdBanner type="160x600" onCollapse={() => setHidden(true)} />
        </aside>
      )}
    </>
  );
}

export function LeaderboardBanner() {
  const [hidden, setHidden] = useState(false);
  if (!AD_ENABLED || hidden) return null;
  return (
    <div className="hidden md:block">
      <div className="relative mx-auto" style={{ maxWidth: "728px" }}>
        <AdBanner type="728x90" onCollapse={() => setHidden(true)} />
      </div>
    </div>
  );
}

export function MobileStickyAd() {
  const [hidden, setHidden] = useState(false);
  if (!AD_ENABLED || hidden) return null;
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex justify-center bg-background/95 backdrop-blur-sm border-t border-border pb-[env(safe-area-inset-bottom)]">
      <div className="relative w-full" style={{ maxWidth: "320px" }}>
        <AdBanner type="320x50" onCollapse={() => setHidden(true)} showCloseButton={false} />
        <CloseButton onClose={() => setHidden(true)} />
      </div>
    </div>
  );
}
