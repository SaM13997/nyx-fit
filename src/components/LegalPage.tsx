import { Link, useRouter } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import type { LegalSection } from "@/lib/legal-content";
import { LEGAL_LAST_UPDATED } from "@/lib/legal-content";

type LegalPageProps = {
  title: string;
  summary: string;
  sections: LegalSection[];
};

export function LegalPage({ title, summary, sections }: LegalPageProps) {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.history.back();
      return;
    }

    void router.navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen px-4 py-6 pb-28 text-white">
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={handleBack}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Go back"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-bold">{title}</h1>
          <p className="text-xs text-zinc-500">Last updated {LEGAL_LAST_UPDATED}</p>
        </div>
      </div>

      <p className="mb-8 text-sm leading-relaxed text-zinc-400">{summary}</p>

      <div className="space-y-6">
        {sections.map((section) => (
          <section
            key={section.id}
            id={section.id}
            className="rounded-2xl border border-white/10 bg-white/5 p-5"
          >
            <h2 className="text-lg font-semibold text-white">{section.title}</h2>
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-zinc-300">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {section.bullets ? (
                <ul className="list-disc space-y-2 pl-5 text-zinc-400">
                  {section.bullets.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
