import { createFileRoute, Link } from "@tanstack/react-router";
import { BoardSection } from "@/components/onboarding/board/BoardSection";
import { WashPanel } from "@/components/onboarding/board/WashPanel";
import { cn } from "@/lib/utils";
import {
  obCaption,
  obFocusRing,
  obSectionTitle,
} from "@/components/onboarding/kit/classes";

export const Route = createFileRoute("/design/")({
  component: DesignOverviewPage,
});

const designBoards = [
  {
    to: "/design/language",
    title: "Design language",
    description:
      "Palette, type scale, radius, shadow, and the spacing rhythm.",
  },
  {
    to: "/design/components",
    title: "Kit inventory",
    description:
      "The full kit inventory, including every state from the shipped kit.",
  },
  {
    to: "/design/screens",
    title: "Screen boards",
    description: "The four screen boards, plus the edge states.",
  },
] as const;

function DesignOverviewPage() {
  return (
    <>
      <BoardSection
        title="Atmosphere"
        description="One full-bleed layer per screen; max two washes; softness comes from multi-stop falloff, not blur. Washes are static paint and never animate."
      >
        <WashPanel />
      </BoardSection>

      <BoardSection
        title="Boards"
        description="The rest of the redesign, split into three boards."
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {designBoards.map((board) => (
            <Link
              key={board.to}
              to={board.to}
              className={cn(
                "flex flex-col gap-2 rounded-3xl bg-ob-card p-5 ob-shadow-rest transition-colors hover:bg-ob-soft",
                obFocusRing,
              )}
            >
              <h3 className={cn(obSectionTitle, "text-ob-ink")}>
                {board.title}
              </h3>
              <p className={cn(obCaption, "text-ob-ink-secondary")}>
                {board.description}
              </p>
            </Link>
          ))}
        </div>
      </BoardSection>
    </>
  );
}
