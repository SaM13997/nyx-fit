import { Link, useSearch } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import type { LegalSection } from "@/lib/legalContent";
import { LEGAL_LAST_UPDATED } from "@/lib/legalContent";

type LegalDocumentLayoutProps = {
  title: string;
  sections: LegalSection[];
};

export function LegalDocumentLayout({
  title,
  sections,
}: LegalDocumentLayoutProps) {
  const search = useSearch({ strict: false }) as { from?: string };
  const backTo = search.from === "settings" ? "/settings" : "/login";

  return (
    <div className="min-h-screen px-4 py-6 pb-24 text-white">
      <div className="mb-6">
        <Link
          to={backTo}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-medium text-zinc-400 transition-colors hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Back
        </Link>
      </div>

      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-orange-400">
          Legal
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Last updated {LEGAL_LAST_UPDATED}
        </p>
      </header>

      <article className="space-y-8">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-lg font-semibold text-zinc-100">
              {section.title}
            </h2>
            <div className="mt-3 space-y-3">
              {section.paragraphs.map((paragraph) => (
                <p
                  key={paragraph}
                  className="text-sm leading-relaxed text-zinc-400"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        ))}
      </article>

      <footer className="mt-10 border-t border-white/10 pt-6 text-sm text-zinc-500">
        <p>
          See also{" "}
          <Link
            to={title === "Privacy Policy" ? "/terms" : "/privacy"}
            className="text-orange-400 underline-offset-2 hover:underline"
          >
            {title === "Privacy Policy" ? "Terms of Service" : "Privacy Policy"}
          </Link>
          .
        </p>
      </footer>
    </div>
  );
}
