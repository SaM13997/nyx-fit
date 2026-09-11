import { cn } from "@/lib/utils";
import { obCaption, obDataLabel, obHeroTitle } from "../kit/classes";

type WashLayer = {
  name: string;
  spec: string;
  background: string;
};

const washLayers: WashLayer[] = [
  {
    name: "wash-base",
    spec: "linear 180deg · #FFFFFF → #FAF9FB",
    background:
      "linear-gradient(180deg, #FFFFFF 0%, #FAF9FB 42%, #FAF9FB 100%)",
  },
  {
    name: "wash-lavender",
    spec: "radial 120% 62% at 16% -8%",
    background:
      "radial-gradient(120% 62% at 16% -8%, #EDE9FE 0%, rgba(237, 233, 254, 0.62) 34%, rgba(237, 233, 254, 0) 74%)",
  },
  {
    name: "wash-mint",
    spec: "radial 130% 58% at 86% -6%",
    background:
      "radial-gradient(130% 58% at 86% -6%, #DDF3E7 0%, rgba(221, 243, 231, 0.55) 38%, rgba(221, 243, 231, 0) 78%)",
  },
  {
    name: "wash-peach",
    spec: "radial 95% 46% at 50% 108%",
    background:
      "radial-gradient(95% 46% at 50% 108%, #FFF1E6 0%, rgba(255, 241, 230, 0.55) 42%, rgba(255, 241, 230, 0) 78%)",
  },
];

export function WashPanel() {
  return (
    <div>
      <div className="relative h-[420px] w-full overflow-hidden rounded-[28px] bg-ob-canvas">
        {washLayers.map((layer) => (
          <div
            key={layer.name}
            aria-hidden="true"
            className="absolute inset-0"
            style={{ backgroundImage: layer.background }}
          />
        ))}
        <div className="absolute top-11 left-12">
          <p className={cn(obHeroTitle, "text-ob-ink")}>Train with intent.</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-4">
        {washLayers.map((layer) => (
          <div
            key={layer.name}
            className="flex min-w-[180px] flex-1 flex-col gap-1"
          >
            <p className={cn(obDataLabel, "text-ob-ink")}>{layer.name}</p>
            <p className={cn(obCaption, "text-ob-ink-secondary")}>
              {layer.spec}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
