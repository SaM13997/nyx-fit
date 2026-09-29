import { BODY_PARTS } from "@/lib/constants";

const LAST_WORKED_KEY = "lastWorkedBodyParts";

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

function readStoredLastWorkedParts(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(LAST_WORKED_KEY) ?? "[]");
    return isStringArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// The latest completed workout (from the home snapshot) wins; localStorage
// (written when a workout ends) covers the case where it has not loaded yet.
export function getLastWorkedParts(
  latest: { bodyPartWorkedOut?: string[] } | null,
): string[] {
  const parts = latest?.bodyPartWorkedOut ?? [];
  return parts.length > 0 ? parts : readStoredLastWorkedParts();
}

// "legs:Quads" entries collapse into their primary part: "Legs, Chest".
export function formatBodyParts(parts: string[] | undefined): string {
  const labels = new Set<string>();
  for (const part of parts ?? []) {
    const id = part.split(":")[0];
    labels.add(BODY_PARTS.find((bodyPart) => bodyPart.id === id)?.label ?? id);
  }
  return Array.from(labels).join(", ");
}
