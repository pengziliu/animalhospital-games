export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <article className="rounded-3xl border border-border bg-card/70 p-6 sm:p-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground">{title}</h1>
        <div className="mt-8 space-y-5 leading-8 text-muted-foreground">{children}</div>
      </article>
    </main>
  );
}

export function LegalSection({ heading, children }: { heading?: string; children: React.ReactNode }) {
  return (
    <section className="mt-8 first:mt-0">
      {heading && <h2 className="mb-3 text-xl font-bold text-foreground">{heading}</h2>}
      <div className="space-y-4 leading-8 text-muted-foreground">{children}</div>
    </section>
  );
}
