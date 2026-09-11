import { createFileRoute } from "@tanstack/react-router";
import { ScreensBoard } from "@/components/onboarding/board/ScreensBoard";
import { cn } from "@/lib/utils";
import { obDetail } from "@/components/onboarding/kit/classes";

export const Route = createFileRoute("/design/screens")({
  component: DesignScreensPage,
});

function DesignScreensPage() {
  return (
    <div className="lg:grid lg:grid-cols-[360px_minmax(0,1fr)] lg:items-start">
      <aside className="px-6 pt-10 pb-8 sm:px-12 lg:sticky lg:top-0 lg:py-12">
        <h2 className="font-heading text-2xl leading-7 font-semibold text-ob-ink">
          Screen boards
        </h2>
        <p
          className={cn(
            obDetail,
            "mt-3 max-w-[300px] text-ob-ink-secondary",
          )}
        >
          The four-step flow at 390 × 844, plus the edge states: no selection,
          existing account, saving, and save error.
        </p>
        <div className="ob-shadow-rest mt-7 rounded-3xl bg-ob-card p-5">
          <p className="font-heading text-lg leading-6 font-semibold text-ob-ink">
            Thumb reachability is the core pillar.
          </p>
          <p className={cn(obDetail, "mt-2 text-ob-ink-secondary")}>
            Primary actions sit in the bottom third of the screen. The landing
            screen carries no chrome.
          </p>
        </div>
      </aside>
      <main className="overflow-x-auto border-t border-ob-hairline bg-ob-soft px-6 pt-10 pb-16 sm:px-12 lg:border-t-0 lg:border-l">
        <ScreensBoard />
      </main>
    </div>
  );
}
