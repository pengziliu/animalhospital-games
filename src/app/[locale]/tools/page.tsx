import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import ClassCalculator from "@/components/tools/ClassCalculator";
import AnomalyEncyclopedia from "@/components/tools/AnomalyEncyclopedia";
import { Calculator, Search } from "lucide-react";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Animal Hospital Tools — Class Calculator & Anomaly Encyclopedia",
    description:
      "Interactive tools for Animal Hospital Roblox. Calculate optimal class purchases and browse the complete anomaly database.",
    alternates: { canonical: "/tools" },
  };
}

export default async function ToolsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-12">
      <section>
        <div className="flex items-center gap-3 mb-6">
          <Calculator className="w-7 h-7 text-[hsl(var(--accent))]" />
          <h1 className="text-3xl font-bold">
            {locale === "ja"
              ? "クラス計算機"
              : locale === "es"
              ? "Calculadora de Clases"
              : locale === "pt"
              ? "Calculadora de Classes"
              : "Class Cost Calculator"}
          </h1>
        </div>
        <ClassCalculator />
      </section>

      <section>
        <div className="flex items-center gap-3 mb-6">
          <Search className="w-7 h-7 text-[hsl(var(--accent))]" />
          <h1 className="text-3xl font-bold">
            {locale === "ja"
              ? "異常図鑑"
              : locale === "es"
              ? "Enciclopedia de Anomalías"
              : locale === "pt"
              ? "Enciclopédia de Anomalias"
              : "Anomaly Encyclopedia"}
          </h1>
        </div>
        <AnomalyEncyclopedia />
      </section>
    </div>
  );
}
