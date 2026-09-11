import { createFileRoute, Link, notFound, Outlet, useRouterState } from "@tanstack/react-router";
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
  { label: "Onboarding", to: "/design/onboarding", exact: false },
] as const;

function DesignLayout() {
  const presentation = useRouterState({
    select: (state) => {
      const value = new URLSearchParams(state.location.searchStr).get(
        "present",
      );
      return value === "1" || value === "true";
    },
  });

  if (presentation) {
    return (
      <div className="theme-onboarding fixed inset-0 z-50 overflow-auto bg-ob-canvas text-ob-ink">
        <main className="min-h-full">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="theme-onboarding fixed inset-0 z-50 overflow-auto bg-ob-canvas text-ob-ink">
      <header className="sticky top-0 z-10 border-b border-ob-hairline bg-ob-canvas px-6 py-3 sm:px-8">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
          <h1 className="font-heading text-lg leading-6 font-semibold text-ob-ink">
            Design language
          </h1>
          <nav aria-label="Design sections">
            <ul className="flex flex-wrap gap-1">
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
                      "flex min-h-11 items-center rounded-lg px-3 transition-colors hover:text-ob-ink",
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
        </div>
      </header>

      <main className="min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
