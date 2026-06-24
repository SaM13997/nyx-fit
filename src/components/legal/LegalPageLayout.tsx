import { Link, useCanGoBack, useRouter } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";

export type LegalSection = {
  title: string;
  body: ReactNode;
};

type LegalPageLayoutProps = {
  title: string;
  effectiveDate: string;
  intro: ReactNode;
  sections: LegalSection[];
};

export function LegalPageLayout({
  title,
  effectiveDate,
  intro,
  sections,
}: LegalPageLayoutProps) {
  const router = useRouter();
  const canGoBack = useCanGoBack();

  const handleBack = () => {
    if (canGoBack) {
      router.history.back();
      return;
    }
    void router.navigate({ to: "/settings" });
  };

  return (
    <div className="min-h-screen px-4 py-6 pb-28 text-white">
      <button
        type="button"
        onClick={handleBack}
        className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-zinc-400 transition-colors hover:text-white"
      >
        <ChevronLeft className="h-5 w-5" aria-hidden />
        Back
      </button>

      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-orange-400">
          Legal
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-zinc-500">Effective {effectiveDate}</p>
      </header>

      <div className="space-y-4">
        <section className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-relaxed text-zinc-300">
          {intro}
        </section>

        {sections.map((section) => (
          <section
            key={section.title}
            className="rounded-2xl border border-white/10 bg-white/5 p-4"
          >
            <h2 className="text-base font-semibold text-white">
              {section.title}
            </h2>
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-zinc-300">
              {section.body}
            </div>
          </section>
        ))}
      </div>

      <footer className="mt-8 flex flex-wrap gap-4 text-sm">
        <Link
          to="/privacy"
          className="font-medium text-purple-400 transition-colors hover:text-purple-300"
        >
          Privacy Policy
        </Link>
        <Link
          to="/terms"
          className="font-medium text-purple-400 transition-colors hover:text-purple-300"
        >
          Terms of Service
        </Link>
      </footer>
    </div>
  );
}
