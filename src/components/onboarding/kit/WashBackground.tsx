import { cn } from "@/lib/utils";

export type OnboardingWash = "welcome" | "experience" | "auth" | "done";

const layersByWash: Record<OnboardingWash, string[]> = {
  welcome: ["ob-wash-lavender-top", "ob-wash-peach-bottom"],
  experience: ["ob-wash-lavender-top", "ob-wash-mint-shoulder"],
  auth: ["ob-wash-mint-top", "ob-wash-lavender-bottom"],
  done: ["ob-wash-mint-top", "ob-wash-lavender-center"],
};

export function WashBackground({ wash }: { wash: OnboardingWash }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      <div className="ob-base" />
      {layersByWash[wash].map((layer) => (
        <div key={layer} className={cn("ob-wash", layer)} />
      ))}
    </div>
  );
}
