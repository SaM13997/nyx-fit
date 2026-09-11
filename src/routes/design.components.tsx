import { createFileRoute } from "@tanstack/react-router";
import { BoardSection } from "@/components/onboarding/board/BoardSection";
import { ComponentsBoard } from "@/components/onboarding/board/ComponentsBoard";

export const Route = createFileRoute("/design/components")({
  component: DesignComponentsPage,
});

function DesignComponentsPage() {
  return (
    <BoardSection title="Kit inventory">
      <ComponentsBoard />
    </BoardSection>
  );
}
