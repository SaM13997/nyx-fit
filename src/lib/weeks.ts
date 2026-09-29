// Calendar helpers for weekly stats.
//
// `workouts.date` is the UTC instant a workout was started (ISO string), so a
// workout's calendar day and week depend on the lifter's time zone. Weeks
// start on Monday and are keyed by their local Monday as "YYYY-MM-DD". The
// zone is the IANA name saved on the profile (captured from the client's
// Intl); when it is missing we fall back to UTC.

export const DEFAULT_TIME_ZONE = "UTC";
const DAY_MS = 86_400_000;

export const isValidTimeZone = (value: string): boolean => {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
};

export const getClientTimeZone = (): string | undefined => {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return zone && isValidTimeZone(zone) ? zone : undefined;
  } catch {
    return undefined;
  }
};

const formatters = new Map<string, Intl.DateTimeFormat>();

const formatterFor = (timeZone: string): Intl.DateTimeFormat => {
  const cached = formatters.get(timeZone);
  if (cached !== undefined) return cached;
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  formatters.set(timeZone, formatter);
  return formatter;
};

export const resolveTimeZone = (value: string | null | undefined): string => {
  if (value === null || value === undefined || value === "") return DEFAULT_TIME_ZONE;
  return isValidTimeZone(value) ? value : DEFAULT_TIME_ZONE;
};

type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

const zonedParts = (instant: number, timeZone: string): ZonedParts => {
  const parts: ZonedParts = { year: 0, month: 0, day: 0, hour: 0, minute: 0, second: 0 };
  for (const part of formatterFor(timeZone).formatToParts(new Date(instant))) {
    switch (part.type) {
      case "year":
        parts.year = Number(part.value);
        break;
      case "month":
        parts.month = Number(part.value);
        break;
      case "day":
        parts.day = Number(part.value);
        break;
      case "hour":
        parts.hour = Number(part.value);
        break;
      case "minute":
        parts.minute = Number(part.value);
        break;
      case "second":
        parts.second = Number(part.value);
        break;
      default:
        break;
    }
  }
  return parts;
};

const pad = (value: number, width: number): string => String(value).padStart(width, "0");

const keyFromUtc = (ms: number): string => new Date(ms).toISOString().slice(0, 10);

const utcFromKey = (key: string): number => {
  const [year, month, day] = key.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
};

// The lifter's local calendar day for an instant.
export const localDateKey = (instant: string | number | Date, timeZone: string): string => {
  const ms = instant instanceof Date ? instant.getTime() : new Date(instant).getTime();
  if (Number.isNaN(ms)) throw new Error("Invalid date");
  const { year, month, day } = zonedParts(ms, timeZone);
  return `${pad(year, 4)}-${pad(month, 2)}-${pad(day, 2)}`;
};

export const addDaysToKey = (key: string, days: number): string =>
  keyFromUtc(utcFromKey(key) + days * DAY_MS);

// Monday of the week containing a local calendar day.
export const weekStartOfKey = (key: string): string => {
  const dayOfWeek = new Date(utcFromKey(key)).getUTCDay();
  return addDaysToKey(key, -((dayOfWeek + 6) % 7));
};

export const weekStartKey = (instant: string | number | Date, timeZone: string): string =>
  weekStartOfKey(localDateKey(instant, timeZone));

export const weeksBetween = (fromWeekStart: string, toWeekStart: string): number =>
  Math.round((utcFromKey(toWeekStart) - utcFromKey(fromWeekStart)) / (7 * DAY_MS));

// The UTC instant (ISO) at which a local calendar day begins.
export const zonedMidnightIso = (key: string, timeZone: string): string => {
  const guess = utcFromKey(key);
  const offsetAt = (instant: number): number => {
    const parts = zonedParts(instant, timeZone);
    const asUtc = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
    );
    return asUtc - Math.floor(instant / 1000) * 1000;
  };
  // Second pass settles days where the offset changes (DST).
  const first = guess - offsetAt(guess);
  return new Date(guess - offsetAt(first)).toISOString();
};
