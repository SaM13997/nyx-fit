import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { obCaption, obFocusRing } from "./classes";

const legalLinkClass =
  "inline-flex min-h-11 items-center font-semibold underline decoration-ob-ink-secondary/30 underline-offset-4 transition-colors duration-150 hover:text-ob-ink motion-reduce:transition-none";

export function LegalRow({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        obCaption,
        "text-center break-words text-ob-ink-secondary",
        className,
      )}
    >
      By clicking continue, you agree to our{" "}
      <Link to="/terms" className={cn(legalLinkClass, obFocusRing)}>
        Terms
      </Link>{" "}
      and{" "}
      <Link to="/privacy" className={cn(legalLinkClass, obFocusRing)}>
        Privacy Policy
      </Link>
      .
    </p>
  );
}
