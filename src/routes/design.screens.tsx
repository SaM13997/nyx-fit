import { createFileRoute } from "@tanstack/react-router";
import { ScreensBoard } from "@/components/onboarding/board/ScreensBoard";

export const Route = createFileRoute("/design/screens")({
  component: DesignScreensPage,
});

function DesignScreensPage() {
  return (
    <section className="px-6 pt-10 pb-16 sm:px-12">
      <ScreensBoard />
    </section>
  );
}
