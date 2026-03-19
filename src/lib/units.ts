import type { WeightUnit } from "@/lib/types";

const LBS_TO_KGS_RATIO = 0.45359237;

export function getWeightStep(unit: WeightUnit): number {
  return unit === "kgs" ? 2.5 : 5;
}

export function convertWeightFromLbs(weight: number, unit: WeightUnit): number {
  if (unit === "kgs") {
    return weight * LBS_TO_KGS_RATIO;
  }

  return weight;
}

export function convertWeightToLbs(weight: number, unit: WeightUnit): number {
  if (unit === "kgs") {
    return weight / LBS_TO_KGS_RATIO;
  }

  return weight;
}

export function formatWeight(weight: number, unit: WeightUnit, decimals = 1): string {
  const converted = convertWeightFromLbs(weight, unit);
  return converted.toFixed(decimals).replace(/\.0$/, "");
}

export function formatWeightUnit(unit: WeightUnit): string {
  return unit;
}
