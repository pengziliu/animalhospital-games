"use client";

import { useState, useMemo } from "react";
import { useLocale } from "next-intl";
import classesData from "@/data/classes.json";
import type { ClassData } from "@/data/types";

const T: Record<string, Record<string, string>> = {
  en: {
    title: "Class Cost Calculator",
    subtitle: "Enter your Animal Coins and Robux budget to find the optimal class path.",
    coins: "Animal Coins",
    robux: "Robux Budget",
    calculate: "Calculate Best Path",
    recommended: "Recommended Path",
    currentClass: "Your Current Class",
    nextStep: "Next Step",
    coinsPerShift: "Est. Coins per Shift",
    shiftsNeeded: "Shifts to Unlock",
    tip: "Based on average 50-200 coins per shift depending on class and efficiency.",
    affordable: "Affordable Classes",
    saveFor: "Save up for",
    bestValue: "Best Value",
    bestPaid: "Best Paid",
    total: "Total Cost",
    free: "Free",
    na: "N/A",
  },
  es: {
    title: "Calculadora de Clases",
    subtitle: "Ingresa tus Animal Coins y Robux para encontrar el camino óptimo de clases.",
    coins: "Animal Coins",
    robux: "Presupuesto Robux",
    calculate: "Calcular Mejor Camino",
    recommended: "Camino Recomendado",
    currentClass: "Tu Clase Actual",
    nextStep: "Próximo Paso",
    coinsPerShift: "Monedas por Turno (est.)",
    shiftsNeeded: "Turnos para Desbloquear",
    tip: "Basado en 50-200 monedas por turno según clase y eficiencia.",
    affordable: "Clases Disponibles",
    saveFor: "Ahorrar para",
    bestValue: "Mejor Valor",
    bestPaid: "Mejor Pago",
    total: "Costo Total",
    free: "Gratis",
    na: "N/A",
  },
  pt: {
    title: "Calculadora de Classes",
    subtitle: "Insira seus Animal Coins e Robux para encontrar o caminho ideal de classes.",
    coins: "Animal Coins",
    robux: "Orçamento Robux",
    calculate: "Calcular Melhor Caminho",
    recommended: "Caminho Recomendado",
    currentClass: "Sua Classe Atual",
    nextStep: "Próximo Passo",
    coinsPerShift: "Moedas por Turno (est.)",
    shiftsNeeded: "Turnos para Desbloquear",
    tip: "Baseado em 50-200 moedas por turno dependendo da classe e eficiência.",
    affordable: "Classes Disponíveis",
    saveFor: "Economizar para",
    bestValue: "Melhor Custo-Benefício",
    bestPaid: "Melhor Pago",
    total: "Custo Total",
    free: "Grátis",
    na: "N/A",
  },
  ja: {
    title: "クラス計算機",
    subtitle: "Animal CoinsとRobuxの予算を入力して、最適なクラス構成を見つけよう。",
    coins: "Animal Coins",
    robux: "Robux予算",
    calculate: "最適構成を計算",
    recommended: "推奨構成",
    currentClass: "現在のクラス",
    nextStep: "次のステップ",
    coinsPerShift: "1シフトあたりの推定コイン",
    shiftsNeeded: "解放までのシフト数",
    tip: "クラスと効率により1シフト50-200コイン想定。",
    affordable: "購入可能クラス",
    saveFor: "目標クラス",
    bestValue: "コスパ最強",
    bestPaid: "課金最強",
    total: "合計コスト",
    free: "無料",
    na: "N/A",
  },
};

function getT(locale: string) {
  return T[locale] || T.en;
}

interface ClassEntry {
  name: string;
  tier: string;
  price_coins: number | null;
  price_robux: number | null;
  currency: string;
  role: string;
  ability: string;
  sanity: string;
}

const classes = (classesData as unknown as { classes: ClassEntry[] }).classes;

const TIER_COLORS: Record<string, string> = {
  S: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  A: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  B: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  C: "bg-green-500/20 text-green-400 border-green-500/30",
  D: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

export default function ClassCalculator() {
  const locale = useLocale();
  const t = getT(locale);
  const [coins, setCoins] = useState(0);
  const [robux, setRobux] = useState(0);

  const affordable = useMemo(() => {
    return classes
      .filter((c) => {
        if (c.price_coins !== null && c.price_coins > coins) return false;
        if (c.price_robux !== null && c.price_robux > robux) return false;
        return true;
      })
      .sort((a, b) => {
        const tierOrder: Record<string, number> = { S: 0, A: 1, B: 2, C: 3, D: 4 };
        return (tierOrder[a.tier] ?? 5) - (tierOrder[b.tier] ?? 5);
      });
  }, [coins, robux]);

  const bestAffordable = affordable.find((c) => c.tier === "S") || affordable[0];
  const nextUpgrade = classes
    .filter((c) => {
      if (c.price_coins === null) return false;
      return c.price_coins > coins;
    })
    .sort((a, b) => {
      const tierOrder: Record<string, number> = { S: 0, A: 1, B: 2, C: 3, D: 4 };
      return (tierOrder[a.tier] ?? 5) - (tierOrder[b.tier] ?? 5);
    })[0];

  const shiftsToNext = nextUpgrade
    ? Math.ceil((nextUpgrade.price_coins! - coins) / 100)
    : null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2 text-muted-foreground">
            {t.coins}
          </label>
          <input
            type="number"
            min={0}
            max={50000}
            value={coins}
            onChange={(e) => setCoins(Math.max(0, parseInt(e.target.value) || 0))}
            className="w-full rounded-lg border bg-background px-4 py-3 text-lg font-mono focus:ring-2 focus:ring-[hsl(var(--accent))] focus:border-transparent outline-none transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 text-muted-foreground">
            {t.robux}
          </label>
          <input
            type="number"
            min={0}
            max={10000}
            value={robux}
            onChange={(e) => setRobux(Math.max(0, parseInt(e.target.value) || 0))}
            className="w-full rounded-lg border bg-background px-4 py-3 text-lg font-mono focus:ring-2 focus:ring-[hsl(var(--accent))] focus:border-transparent outline-none transition-all"
          />
        </div>
      </div>

      {/* Best affordable */}
      {bestAffordable && (
        <div className="rounded-xl border-2 border-[hsl(var(--accent))] bg-[hsl(var(--accent))]/5 p-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                {t.bestValue}
              </p>
              <p className="text-xl font-bold">{bestAffordable.name}</p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-sm font-bold border ${
                TIER_COLORS[bestAffordable.tier] || TIER_COLORS.D
              }`}
            >
              {bestAffordable.tier} Tier
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">{bestAffordable.ability}</p>
        </div>
      )}

      {/* Next upgrade target */}
      {nextUpgrade && (
        <div className="rounded-xl border bg-muted/30 p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
            {t.nextStep}
          </p>
          <p className="text-lg font-bold mt-1">
            {t.saveFor} <span className="text-[hsl(var(--accent))]">{nextUpgrade.name}</span>
          </p>
          <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
            <span>
              {t.total}: {nextUpgrade.price_coins?.toLocaleString()} coins
            </span>
            <span>
              {t.shiftsNeeded}: ~{shiftsToNext} {shiftsToNext === 1 ? "shift" : "shifts"}
            </span>
          </div>
        </div>
      )}

      {/* All affordable classes */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          {t.affordable} ({affordable.length}/{classes.length})
        </h3>
        <div className="space-y-2">
          {affordable.map((c) => (
            <div
              key={c.name}
              className="flex items-center justify-between rounded-lg border bg-background p-3 hover:bg-muted/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold border ${
                    TIER_COLORS[c.tier] || TIER_COLORS.D
                  }`}
                >
                  {c.tier}
                </span>
                <div>
                  <p className="font-semibold text-sm">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.role}</p>
                </div>
              </div>
              <span className="text-sm font-mono text-muted-foreground">
                {c.price_coins
                  ? `${c.price_coins.toLocaleString()} coins`
                  : c.price_robux
                  ? `${c.price_robux} R$`
                  : t.free}
              </span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground italic">{t.tip}</p>
    </div>
  );
}
