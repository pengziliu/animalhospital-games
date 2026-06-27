"use client";

import { useState, useMemo } from "react";
import { useLocale } from "next-intl";
import anomaliesData from "@/data/anomalies.json";

const T: Record<string, Record<string, string>> = {
  en: {
    title: "Anomaly Encyclopedia",
    subtitle: "Filter and explore all anomalies by detection method. Learn how to spot every hidden monster.",
    all: "All",
    appearance: "Appearance",
    photo: "Photo",
    cctv: "CCTV",
    monsters: "Monsters",
    difficulty: "Difficulty",
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",
    veryHard: "Very Hard",
    action: "How to Handle",
    danger: "Danger",
    low: "Low",
    medium2: "Medium",
    high: "High",
    veryHigh: "Very High",
    search: "Search anomalies...",
    total: "Total",
    showing: "Showing",
    of: "of",
    results: "results",
    description: "Description",
    detection: "Detection Method",
  },
  es: {
    title: "Enciclopedia de Anomalías",
    subtitle: "Filtra y explora todas las anomalías por método de detección.",
    all: "Todas",
    appearance: "Apariencia",
    photo: "Foto",
    cctv: "CCTV",
    monsters: "Monstruos",
    difficulty: "Dificultad",
    easy: "Fácil",
    medium: "Medio",
    hard: "Difícil",
    veryHard: "Muy Difícil",
    action: "Cómo Manejar",
    danger: "Peligro",
    low: "Bajo",
    medium2: "Medio",
    high: "Alto",
    veryHigh: "Muy Alto",
    search: "Buscar anomalías...",
    total: "Total",
    showing: "Mostrando",
    of: "de",
    results: "resultados",
    description: "Descripción",
    detection: "Método de Detección",
  },
  pt: {
    title: "Enciclopédia de Anomalias",
    subtitle: "Filtre e explore todas as anomalias por método de detecção.",
    all: "Todas",
    appearance: "Aparência",
    photo: "Foto",
    cctv: "CCTV",
    monsters: "Monstros",
    difficulty: "Dificuldade",
    easy: "Fácil",
    medium: "Médio",
    hard: "Difícil",
    veryHard: "Muito Difícil",
    action: "Como Lidar",
    danger: "Perigo",
    low: "Baixo",
    medium2: "Médio",
    high: "Alto",
    veryHigh: "Muito Alto",
    search: "Buscar anomalias...",
    total: "Total",
    showing: "Mostrando",
    of: "de",
    results: "resultados",
    description: "Descrição",
    detection: "Método de Detecção",
  },
  ja: {
    title: "異常図鑑",
    subtitle: "検出方法でフィルタリングして、すべての異常を探索しよう。",
    all: "全て",
    appearance: "外見",
    photo: "写真",
    cctv: "CCTV",
    monsters: "モンスター",
    difficulty: "難易度",
    easy: "簡単",
    medium: "普通",
    hard: "難しい",
    veryHard: "非常に難しい",
    action: "対処法",
    danger: "危険度",
    low: "低",
    medium2: "中",
    high: "高",
    veryHigh: "非常に高",
    search: "異常を検索...",
    total: "合計",
    showing: "表示中",
    of: "/",
    results: "件",
    description: "説明",
    detection: "検出方法",
  },
};

function getT(locale: string) {
  return T[locale] || T.en;
}

interface AnomalyEntry {
  id: string;
  name: string;
  category: string;
  detection_method: string;
  description: string;
  how_to_handle: string;
  difficulty?: string;
  danger_level?: string;
}

interface MonsterEntry {
  id: string;
  name: string;
  category: string;
  description: string;
  how_to_handle: string;
  location?: string;
  danger_level: string;
}

type FilterCategory = "all" | "appearance" | "photo" | "cctv" | "monsters";

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: "bg-green-500/20 text-green-400 border-green-500/30",
  Medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  Hard: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  "Very Hard": "bg-red-500/20 text-red-400 border-red-500/30",
};

const DANGER_COLORS: Record<string, string> = {
  Low: "bg-green-500/20 text-green-400",
  Medium: "bg-yellow-500/20 text-yellow-400",
  High: "bg-orange-500/20 text-orange-400",
  "Very High": "bg-red-500/20 text-red-400",
};

export default function AnomalyEncyclopedia() {
  const locale = useLocale();
  const t = getT(locale);
  const [filter, setFilter] = useState<FilterCategory>("all");
  const [search, setSearch] = useState("");

  const data = anomaliesData as {
    appearance_anomalies: AnomalyEntry[];
    photo_anomalies: AnomalyEntry[];
    cctv_anomalies: AnomalyEntry[];
    monsters: MonsterEntry[];
  };

  const allItems = useMemo(() => {
    const items: Array<{
      id: string;
      name: string;
      category: string;
      description: string;
      how_to_handle: string;
      badge: string;
      badgeColor: string;
    }> = [];

    for (const a of data.appearance_anomalies || []) {
      items.push({
        id: a.id,
        name: a.name,
        category: "appearance",
        description: a.description,
        how_to_handle: a.how_to_handle,
        badge: a.difficulty || "Medium",
        badgeColor: DIFFICULTY_COLORS[a.difficulty || "Medium"] || DIFFICULTY_COLORS.Medium,
      });
    }
    for (const a of data.photo_anomalies || []) {
      items.push({
        id: a.id,
        name: a.name,
        category: "photo",
        description: a.description,
        how_to_handle: a.how_to_handle,
        badge: a.difficulty || "Medium",
        badgeColor: DIFFICULTY_COLORS[a.difficulty || "Medium"] || DIFFICULTY_COLORS.Medium,
      });
    }
    for (const a of data.cctv_anomalies || []) {
      items.push({
        id: a.id,
        name: a.name,
        category: "cctv",
        description: a.description,
        how_to_handle: a.how_to_handle,
        badge: a.difficulty || "Hard",
        badgeColor: DIFFICULTY_COLORS[a.difficulty || "Hard"] || DIFFICULTY_COLORS.Hard,
      });
    }
    for (const m of data.monsters || []) {
      items.push({
        id: m.id,
        name: m.name,
        category: "monsters",
        description: m.description,
        how_to_handle: m.how_to_handle,
        badge: m.danger_level || "Medium",
        badgeColor: DANGER_COLORS[m.danger_level || "Medium"] || DANGER_COLORS.Medium,
      });
    }
    return items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    let items = allItems;
    if (filter !== "all") {
      items = items.filter((i) => i.category === filter);
    }
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          i.how_to_handle.toLowerCase().includes(q)
      );
    }
    return items;
  }, [filter, search, allItems]);

  const categories: Array<{ key: FilterCategory; label: string; count: number }> = [
    { key: "all", label: t.all, count: allItems.length },
    { key: "appearance", label: t.appearance, count: (data.appearance_anomalies || []).length },
    { key: "photo", label: t.photo, count: (data.photo_anomalies || []).length },
    { key: "cctv", label: t.cctv, count: (data.cctv_anomalies || []).length },
    { key: "monsters", label: t.monsters, count: (data.monsters || []).length },
  ];

  return (
    <div className="space-y-6">
      {/* Search */}
      <input
        type="text"
        placeholder={t.search}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-lg border bg-background px-4 py-3 focus:ring-2 focus:ring-[hsl(var(--accent))] focus:border-transparent outline-none transition-all"
      />

      {/* Category filters */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setFilter(cat.key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
              filter === cat.key
                ? "bg-[hsl(var(--accent))] text-accent-foreground border-[hsl(var(--accent))]"
                : "bg-background border-border hover:bg-muted/20"
            }`}
          >
            {cat.label} ({cat.count})
          </button>
        ))}
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        {t.showing} {filtered.length} {t.of} {allItems.length} {t.results}
      </p>

      {/* Anomaly cards */}
      <div className="grid gap-3">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border bg-background p-4 hover:bg-muted/10 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-bold border ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                  <span className="text-xs text-muted-foreground capitalize">
                    {item.category}
                  </span>
                </div>
                <h3 className="text-base font-bold mb-2">{item.name}</h3>
                <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-[hsl(var(--accent))] font-medium">→</span>
                  <span>{item.how_to_handle}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
