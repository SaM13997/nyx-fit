import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getUserLocale() {
  if (typeof navigator !== "undefined" && navigator.language) {
    return navigator.language
  }

  return "en-US"
}

export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours > 0) {
    return `${hours}h ${remainingMinutes}m`;
  }
  return `${minutes}m`;
}

export function formatLocaleDate(
  value: Date | string,
  options: Intl.DateTimeFormatOptions = {
    weekday: "short",
    month: "short",
    day: "numeric",
  }
) {
  const date = value instanceof Date ? value : new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "--"
  }

  return new Intl.DateTimeFormat(getUserLocale(), options).format(date)
}

export function formatLocaleTime(
  value: Date | string,
  options: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
  }
) {
  const date = value instanceof Date ? value : new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "--"
  }

  return new Intl.DateTimeFormat(getUserLocale(), options).format(date)
}

export function formatCountLabel(
  count: number,
  singular: string,
  plural = `${singular}s`
) {
  const rule = new Intl.PluralRules(getUserLocale()).select(count)
  return `${count} ${rule === "one" ? singular : plural}`
}

export function getInitialCharacter(value: string) {
  const trimmed = value.trim()

  if (!trimmed) {
    return "?"
  }

  return Array.from(trimmed)[0]?.toUpperCase() ?? "?"
}
