import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { LegalPage, LegalSection } from "@/components/legal-page";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal.about" });
  return { title: t("title"), description: t("metaDescription") };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "legal.about" });
  const sections = t.raw("sections") as Array<{ heading: string; paragraphs: string[] }>;

  return (
    <LegalPage title={t("title")}>
      {sections.map((section, i) => (
        <LegalSection key={i} heading={section.heading}>
          {section.paragraphs.map((p, j) => (
            <p key={j}>{p}</p>
          ))}
        </LegalSection>
      ))}
    </LegalPage>
  );
}
