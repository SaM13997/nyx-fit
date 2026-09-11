import { createFileRoute, Link, notFound, Outlet } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { obFocusRing, obLinkLabel } from "@/components/onboarding/kit/classes";

export const Route = createFileRoute("/design")({
  beforeLoad: () => {
    if (!import.meta.env.DEV) throw notFound();
  },
  component: DesignLayout,
});

const designNavItems = [
  { label: "Overview", to: "/design", exact: true },
  { label: "Language", to: "/design/language", exact: false },
  { label: "Components", to: "/design/components", exact: false },
  { label: "Screens", to: "/design/screens", exact: false },
] as const;

function DesignLayout() {
  return (
    <div className="theme-onboarding fixed inset-0 z-50 overflow-auto bg-ob-canvas text-ob-ink">
      <div className="flex min-h-full flex-col lg:flex-row lg:items-start">
        <header className="border-b border-ob-hairline px-6 pt-8 pb-5 sm:px-8 lg:sticky lg:top-0 lg:h-svh lg:w-[280px] lg:shrink-0 lg:border-r lg:border-b-0 lg:px-8 lg:py-10">
          <h1 className="font-heading text-2xl leading-8 font-semibold text-ob-ink">
            Nyx Fit — Onboarding Design Language
          </h1>
          <nav aria-label="Design sections" className="mt-5">
            <ul className="flex flex-wrap gap-1 lg:flex-col">
              {designNavItems.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    activeOptions={{ exact: item.exact }}
                    inactiveProps={{ className: "text-ob-ink-secondary" }}
                    activeProps={{
                      className: "bg-ob-soft text-ob-ink",
                      "aria-current": "page",
                    }}
                    className={cn(
                      "flex min-h-11 items-center rounded-lg px-3 transition-colors hover:text-ob-ink lg:-mx-3",
                      obLinkLabel,
                      obFocusRing,
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </header>

        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
