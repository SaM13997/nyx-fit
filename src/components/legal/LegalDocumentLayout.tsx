import { Link, useRouter } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";

type LegalDocumentLayoutProps = {
  title: string;
  lastUpdated: string;
  children: ReactNode;
};

export function LegalDocumentLayout({
  title,
  lastUpdated,
  children,
}: LegalDocumentLayoutProps) {
  const router = useRouter();

  const handleBack = () => {
    if (router.history.canGoBack()) {
      router.history.back();
      return;
    }

    void router.navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen bg-black px-4 pb-24 pt-6 text-white">
      <div className="mx-auto max-w-lg">
        <button
          type="button"
          onClick={handleBack}
          className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>

        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-400">
            Nyx Fitness
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm text-zinc-500">Last updated {lastUpdated}</p>
        </header>

        <article className="space-y-6 text-sm leading-relaxed text-zinc-300 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-white [&_h2]:pt-2 [&_li]:ml-5 [&_li]:list-disc [&_p+p]:mt-3 [&_ul]:space-y-2">
          {children}
        </article>

        <footer className="mt-10 border-t border-white/10 pt-6 text-xs text-zinc-500">
          <p>
            Questions? Contact{" "}
            <a
              href="mailto:support@nyxfit.app"
              className="text-purple-400 underline-offset-2 hover:underline"
            >
              support@nyxfit.app
            </a>
          </p>
          <div className="mt-3 flex flex-wrap gap-4">
            <Link
              to="/privacy"
              className="text-zinc-400 transition-colors hover:text-white"
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms"
              className="text-zinc-400 transition-colors hover:text-white"
            >
              Terms of Service
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
