import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { obDetail } from "../kit/classes";

export function BoardSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-ob-hairline px-6 pt-10 pb-11 first:border-t-0 sm:px-12">
      <h2 className="font-heading text-2xl leading-7 font-semibold text-ob-ink">
        {title}
      </h2>
      {description ? (
        <p className={cn(obDetail, "mt-2 max-w-[900px] text-ob-ink-secondary")}>
          {description}
        </p>
      ) : null}
      <div className="mt-7">{children}</div>
    </section>
  );
}
