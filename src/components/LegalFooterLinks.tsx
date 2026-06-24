import { Link } from "@tanstack/react-router";

type LegalFooterLinksProps = {
  className?: string;
};

export function LegalFooterLinks({ className = "" }: LegalFooterLinksProps) {
  return (
    <p className={`text-xs text-zinc-500 ${className}`.trim()}>
      <Link
        to="/terms"
        className="underline underline-offset-2 transition-colors hover:text-zinc-300"
      >
        Terms
      </Link>
      <span className="mx-1.5 text-zinc-600">·</span>
      <Link
        to="/privacy"
        className="underline underline-offset-2 transition-colors hover:text-zinc-300"
      >
        Privacy
      </Link>
    </p>
  );
}
