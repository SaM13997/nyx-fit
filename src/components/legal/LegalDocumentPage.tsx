import { Link, useCanGoBack, useRouter } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";

type LegalDocumentPageProps = {
  title: string;
  lastUpdated: string;
  children: ReactNode;
};

export function LegalDocumentPage({
  title,
  lastUpdated,
  children,
}: LegalDocumentPageProps) {
  const router = useRouter();
  const canGoBack = useCanGoBack();

  return (
    <div className="min-h-screen px-4 py-6 pb-24 text-white">
      <div className="mx-auto max-w-lg">
        <button
          type="button"
          onClick={() => {
            if (canGoBack) {
              router.history.back();
              return;
            }
            void router.navigate({ to: "/login" });
          }}
          className="mb-6 inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-medium text-zinc-400 transition-colors hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Back
        </button>

        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-400">
            Nyx Fitness
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm text-zinc-500">Last updated {lastUpdated}</p>
        </header>

        <article className="space-y-8 text-sm leading-relaxed text-zinc-300">
          {children}
        </article>
      </div>
    </div>
  );
}

type LegalSectionProps = {
  title: string;
  children: ReactNode;
};

export function LegalSection({ title, children }: LegalSectionProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <h2 className="text-base font-semibold text-white">{title}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

export function LegalLink({
  to,
  children,
}: {
  to: "/privacy" | "/terms";
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      className="font-medium text-orange-400 underline decoration-orange-400/40 underline-offset-4 transition-colors hover:text-orange-300"
    >
      {children}
    </Link>
  );
}
