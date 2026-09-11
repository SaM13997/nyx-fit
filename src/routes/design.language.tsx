import { createFileRoute } from "@tanstack/react-router";
import { BoardSection } from "@/components/onboarding/board/BoardSection";
import { PaletteBoard } from "@/components/onboarding/board/PaletteBoard";
import { ShapeBoard } from "@/components/onboarding/board/ShapeBoard";
import { TypeBoard } from "@/components/onboarding/board/TypeBoard";

export const Route = createFileRoute("/design/language")({
  component: DesignLanguagePage,
});

function DesignLanguagePage() {
  return (
    <>
      <BoardSection
        title="Color tokens"
        description="Every value derives from the scene. Lime is selection and positive only, always paired with an ink glyph; coral appears at most once per screen, inside a data surface."
      >
        <PaletteBoard />
      </BoardSection>

      <BoardSection
        title="Typography"
        description="Sixteen roles, roman only. Standalone data numerals render in Chakra Petch 600 with negative tracking and tabular figures; inline numerals stay Titillium Web."
      >
        <TypeBoard />
      </BoardSection>

      <BoardSection
        title="Radius, shadow, rhythm"
        description="Resting cards carry no borders — separation comes from shadow and spacing. Hairlines are dividers only. Selected option cards are the single exception: 1.5px ink border plus float shadow."
      >
        <ShapeBoard />
      </BoardSection>
    </>
  );
}
