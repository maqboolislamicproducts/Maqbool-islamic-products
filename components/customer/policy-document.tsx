import Link from "next/link";
import { FileText, Mail } from "lucide-react";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { PageBanner } from "@/components/layout/page-banner";

export type PolicySection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

export function PolicyDocument({ title, summary, updated = "25 July 2026", sections }: {
  title: string;
  summary: string;
  updated?: string;
  sections: PolicySection[];
}) {
  return (
    <>
      <Header />
      <PageBanner title={title} current={title} />
      <main className="bg-cream/40 py-12 sm:py-16">
        <div className="site-container grid gap-8 lg:grid-cols-[240px_1fr]">
          <aside className="h-fit rounded-xl border border-[#e8ddc8] bg-white p-5 lg:sticky lg:top-28">
            <div className="flex items-center gap-2 text-forest"><FileText className="h-4 w-4 text-gold" aria-hidden="true" /><strong className="text-sm">On this page</strong></div>
            <nav aria-label={`${title} sections`} className="mt-4">
              <ol className="space-y-1">
                {sections.map((section, index) => (
                  <li key={section.title}><a href={`#policy-${index}`} className="block min-h-10 rounded-md px-3 py-2 text-xs leading-5 text-muted hover:bg-cream hover:text-forest">{section.title}</a></li>
                ))}
              </ol>
            </nav>
            <Link href="/contact" className="mt-5 flex min-h-11 items-center gap-2 border-t border-[#eee7d8] pt-5 text-xs font-bold text-forest"><Mail className="h-4 w-4 text-gold" /> Need help? Contact us</Link>
          </aside>
          <article className="rounded-xl border border-[#e8ddc8] bg-white p-6 sm:p-10">
            <header className="border-b border-[#eee7d8] pb-7">
              <p className="text-xs font-bold uppercase tracking-[.18em] text-gold">Maqbool Islamic Products</p>
              <h1 className="mt-2 font-heading text-3xl text-forest">{title}</h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-muted">{summary}</p>
              <p className="mt-4 text-xs font-semibold text-forest">Last updated: {updated}</p>
            </header>
            <div className="mt-8 space-y-9">
              {sections.map((section, index) => (
                <section key={section.title} id={`policy-${index}`} className="scroll-mt-32" aria-labelledby={`policy-title-${index}`}>
                  <h2 id={`policy-title-${index}`} className="font-heading text-2xl text-forest">{index + 1}. {section.title}</h2>
                  {section.paragraphs?.map((paragraph) => <p key={paragraph} className="mt-3 text-sm leading-7 text-muted">{paragraph}</p>)}
                  {section.bullets && <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-muted">{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>}
                </section>
              ))}
            </div>
            <div className="mt-10 rounded-lg bg-forest px-6 py-5 text-white">
              <p className="font-heading text-lg">A note about this storefront</p>
              <p className="mt-2 text-xs leading-6 text-[#d5e2dd]">Order summaries are saved in this browser for convenient access. Online payments are processed securely by Razorpay; Maqbool does not store your card, UPI PIN, or banking credentials.</p>
            </div>
          </article>
        </div>
      </main>
      <Footer />
    </>
  );
}
