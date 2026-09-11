import { cn } from "@/lib/utils";
import { obCaption, obDataLabel } from "../kit/classes";

type PaletteToken = {
  name: string;
  value: string;
  role: string;
  swatch: string;
};

type PaletteGroup = {
  title: string;
  tokens: PaletteToken[];
};

const paletteGroups: PaletteGroup[] = [
  {
    title: "Surfaces & structure",
    tokens: [
      { name: "canvas", value: "#FAF9FB", role: "Page base", swatch: "#faf9fb" },
      {
        name: "card",
        value: "#FFFFFF",
        role: "Resting surface",
        swatch: "#ffffff",
      },
      {
        name: "surface-soft",
        value: "#F1F0F4",
        role: "Neutral fill",
        swatch: "#f1f0f4",
      },
      {
        name: "disabled-fill",
        value: "#ECEAF0",
        role: "Disabled surface",
        swatch: "#eceaf0",
      },
      {
        name: "bar-rest",
        value: "#EDECF0",
        role: "Decorative chart fill",
        swatch: "#edecf0",
      },
      {
        name: "hairline",
        value: "rgba(23,23,26,0.06)",
        role: "Divider only",
        swatch: "rgba(23,23,26,0.06)",
      },
    ],
  },
  {
    title: "Atmosphere washes",
    tokens: [
      {
        name: "wash-lavender",
        value: "#EDE9FE",
        role: "Atmosphere",
        swatch: "#ede9fe",
      },
      {
        name: "wash-mint",
        value: "#DDF3E7",
        role: "Atmosphere",
        swatch: "#ddf3e7",
      },
      {
        name: "wash-peach",
        value: "#FFF1E6",
        role: "Atmosphere",
        swatch: "#fff1e6",
      },
    ],
  },
  {
    title: "Ink & control lines",
    tokens: [
      {
        name: "ink",
        value: "#17171A",
        role: "Text + dark surface",
        swatch: "#17171a",
      },
      {
        name: "ink-secondary",
        value: "#63636D",
        role: "Secondary text",
        swatch: "#63636d",
      },
      {
        name: "control-line",
        value: "#7C7C87",
        role: "Control strokes",
        swatch: "#7c7c87",
      },
    ],
  },
  {
    title: "Action & progress",
    tokens: [
      {
        name: "action",
        value: "#17171A",
        role: "Primary action",
        swatch: "#17171a",
      },
      {
        name: "action-hover",
        value: "#2E2E36",
        role: "Action hover",
        swatch: "#2e2e36",
      },
      {
        name: "action-active",
        value: "#0B0B0E",
        role: "Action pressed",
        swatch: "#0b0b0e",
      },
      {
        name: "progress",
        value: "#147233",
        role: "Progress arc",
        swatch: "#147233",
      },
      {
        name: "track",
        value: "#EDECF0",
        role: "Track fill",
        swatch: "#edecf0",
      },
    ],
  },
  {
    title: "Positive & selection",
    tokens: [
      {
        name: "lime",
        value: "#C6F25E",
        role: "Selection · positive",
        swatch: "#c6f25e",
      },
      {
        name: "green",
        value: "#147233",
        role: "Positive text · dot",
        swatch: "#147233",
      },
      {
        name: "green-tint",
        value: "#E7F6E7",
        role: "Positive fill",
        swatch: "#e7f6e7",
      },
    ],
  },
  {
    title: "Alerts & emphasis",
    tokens: [
      {
        name: "coral",
        value: "#F5502E",
        role: "One data emphasis",
        swatch: "#f5502e",
      },
      {
        name: "red-notice",
        value: "#DC2626",
        role: "Notification dot",
        swatch: "#dc2626",
      },
      {
        name: "alert-bg",
        value: "#FEF2F2",
        role: "Error alert fill",
        swatch: "#fef2f2",
      },
      {
        name: "alert-line",
        value: "#FECACA",
        role: "Error alert hairline",
        swatch: "#fecaca",
      },
      {
        name: "alert-text",
        value: "#B91C1C",
        role: "Error alert copy",
        swatch: "#b91c1c",
      },
    ],
  },
];

export function PaletteBoard() {
  return (
    <div className="flex flex-col gap-7">
      {paletteGroups.map((group) => (
        <div key={group.title} className="flex flex-col gap-3">
          <p className={cn(obDataLabel, "text-ob-ink-secondary")}>{group.title}</p>
          <div className="flex flex-wrap gap-4">
            {group.tokens.map((token) => (
              <div
                key={token.name}
                className="ob-shadow-rest flex min-h-[120px] w-[174px] shrink-0 flex-col rounded-2xl bg-ob-card p-3.5"
              >
                <div
                  className="size-8 shrink-0 rounded-[10px] border border-ob-hairline"
                  style={{ backgroundColor: token.swatch }}
                />
                <p className={cn(obDataLabel, "mt-2.5 text-ob-ink")}>
                  {token.name}
                </p>
                <p className={cn(obCaption, "mt-0.5 text-ob-ink-secondary")}>
                  {token.value}
                </p>
                <p className={cn(obCaption, "mt-1.5 text-ob-ink-secondary")}>
                  {token.role}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
