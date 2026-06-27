import { BookOpen, Code2, FolderOpen, Swords, Trophy, Stethoscope, AlertTriangle, Calculator } from "lucide-react";

/**
 * 主导航分类 — Animal Hospital game wiki.
 */
export const NAVIGATION_CONFIG = [
  { key: "codes", path: "/codes", icon: Code2, isContentType: true },
  { key: "guide", path: "/guide", icon: BookOpen, isContentType: true },
  { key: "tier-list", path: "/tier-list", icon: Trophy, isContentType: true },
  { key: "classes", path: "/classes", icon: Stethoscope, isContentType: true },
  { key: "anomalies", path: "/anomalies", icon: AlertTriangle, isContentType: true },
  { key: "items", path: "/items", icon: FolderOpen, isContentType: true },
  { key: "builds", path: "/builds", icon: Swords, isContentType: true },
  { key: "tools", path: "/tools", icon: Calculator, isContentType: false },
] as const;

export const CONTENT_TYPES = NAVIGATION_CONFIG.filter((item) => item.isContentType).map((item) => item.path.replace(/^\//, ""));
