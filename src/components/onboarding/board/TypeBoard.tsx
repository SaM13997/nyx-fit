import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  obBody,
  obButtonLabel,
  obCaption,
  obDataLabel,
  obDetail,
  obHeroTitle,
  obLinkLabel,
  obMicro,
  obNumberL,
  obNumberM,
  obNumberXl,
  obRowTitle,
  obScreenTitle,
  obSectionTitle,
} from "../kit/classes";

type TypeRow = {
  name: string;
  spec: string;
  sample: ReactNode;
};

const typeRows: TypeRow[] = [
  {
    name: "Hero H1 · Welcome only",
    spec: "Chakra Petch 600 · 34/40 · −0.01em",
    sample: <span className={obHeroTitle}>Train with intent.</span>,
  },
  {
    name: "Screen H1 · question",
    spec: "Chakra Petch 600 · 30/38 · −0.01em",
    sample: (
      <span className={obScreenTitle}>What is your training experience?</span>
    ),
  },
  {
    name: "Hero number XL · ring",
    spec: "Chakra Petch 600 · 40/44 · −0.02em · tabular",
    sample: <span className={obNumberXl}>65</span>,
  },
  {
    name: "Data number L · dark card",
    spec: "Chakra Petch 600 · 32/36 · −0.02em · tabular",
    sample: <span className={obNumberL}>59</span>,
  },
  {
    name: "Data number M · kit totals",
    spec: "Chakra Petch 600 · 24/28 · −0.01em · tabular",
    sample: <span className={obNumberM}>1,284</span>,
  },
  {
    name: "Section title · card headers",
    spec: "Chakra Petch 600 · 18/24",
    sample: <span className={obSectionTitle}>Weekly activity</span>,
  },
  {
    name: "Row / option title",
    spec: "Titillium Web 600 · 17/22",
    sample: <span className={obRowTitle}>Intermediate</span>,
  },
  {
    name: "Body · screen descriptions",
    spec: "Titillium Web 400 · 16/24",
    sample: <span className={obBody}>Log workouts and follow your progress.</span>,
  },
  {
    name: "Body strong · inline emphasis",
    spec: "Titillium Web 600 · 16/24",
    sample: (
      <span className="text-base leading-6 font-semibold">
        Start by setting your training experience.
      </span>
    ),
  },
  {
    name: "Option detail · alert copy",
    spec: "Titillium Web 400 · 14/20",
    sample: (
      <span className={cn(obDetail, "text-ob-ink-secondary")}>
        I'm comfortable with the basics and have trained consistently.
      </span>
    ),
  },
  {
    name: "Button",
    spec: "Titillium Web 700 · 16/20 · +0.01em",
    sample: <span className={obButtonLabel}>Set up my profile</span>,
  },
  {
    name: "Link · text + legal",
    spec: "Titillium Web 600 · 14/20",
    sample: (
      <span className={cn(obLinkLabel, "text-ob-ink-secondary")}>
        I already have an account
      </span>
    ),
  },
  {
    name: "Data label · chips, greeting line",
    spec: "Titillium Web 600 · 13/18 · +0.01em",
    sample: <span className={obDataLabel}>hours</span>,
  },
  {
    name: "Greeting · kit support over name",
    spec: "Titillium Web 400/600 · 13/18 over 16/20",
    sample: (
      <span className="flex flex-col gap-0.5">
        <span className="text-[13px] leading-[18px] text-ob-ink-secondary">
          Built around you
        </span>
        <span className="text-base leading-5 font-semibold text-ob-ink">
          Nyx Fit
        </span>
      </span>
    ),
  },
  {
    name: "Caption · legal, ring caption",
    spec: "Titillium Web 400 · 12/16",
    sample: (
      <span className={cn(obCaption, "text-ob-ink-secondary")}>
        Setup complete
      </span>
    ),
  },
  {
    name: "Micro label · uppercase, tracked",
    spec: "Chakra Petch 600 · 11/14 · +0.06em",
    sample: (
      <span className={cn(obMicro, "text-ob-ink-secondary")}>
        Step 2 of 4
      </span>
    ),
  },
];

export function TypeBoard() {
  return (
    <div className="flex flex-col">
      {typeRows.map((row) => (
        <div
          key={row.name}
          className="flex flex-col gap-2 border-t border-ob-hairline py-[18px] sm:flex-row sm:items-center"
        >
          <div className="flex w-full shrink-0 flex-col gap-0.5 sm:w-[320px] sm:pr-6">
            <p className={cn(obDataLabel, "text-ob-ink")}>{row.name}</p>
            <p className={cn(obCaption, "text-ob-ink-secondary")}>{row.spec}</p>
          </div>
          <div className="min-w-0 flex-1 text-ob-ink">{row.sample}</div>
        </div>
      ))}
    </div>
  );
}
