import { describe, expect, it } from "vitest";
import {
  addDaysToKey,
  isValidTimeZone,
  localDateKey,
  resolveTimeZone,
  weekStartKey,
  weekStartOfKey,
  zonedMidnightIso,
} from "./weeks";

describe("weekly buckets", () => {
  it("starts weeks on Monday", () => {
    expect(weekStartOfKey("2026-09-14")).toBe("2026-09-14");
    expect(weekStartOfKey("2026-09-20")).toBe("2026-09-14");
    expect(weekStartOfKey("2026-09-21")).toBe("2026-09-21");
    expect(weekStartOfKey("2026-01-01")).toBe("2025-12-29");
  });

  it("uses the lifter's local day, not the UTC day", () => {
    // Sunday 22:00 in Los Angeles is already Monday in UTC.
    const instant = "2026-09-14T05:00:00.000Z";
    expect(localDateKey(instant, "America/Los_Angeles")).toBe("2026-09-13");
    expect(weekStartKey(instant, "America/Los_Angeles")).toBe("2026-09-07");
    expect(weekStartKey(instant, "UTC")).toBe("2026-09-14");
    // Monday 01:00 in Auckland is still Sunday in UTC.
    expect(weekStartKey("2026-09-13T13:00:00.000Z", "Pacific/Auckland")).toBe("2026-09-14");
    expect(weekStartKey("2026-09-13T13:00:00.000Z", "UTC")).toBe("2026-09-07");
  });

  it("finds the UTC instant a local day begins, across DST changes", () => {
    expect(zonedMidnightIso("2026-09-14", "America/Los_Angeles")).toBe("2026-09-14T07:00:00.000Z");
    expect(zonedMidnightIso("2026-09-14", "UTC")).toBe("2026-09-14T00:00:00.000Z");
    // US DST ended 2026-11-01: midnight is still PDT, the next day is PST.
    expect(zonedMidnightIso("2026-11-01", "America/Los_Angeles")).toBe("2026-11-01T07:00:00.000Z");
    expect(zonedMidnightIso("2026-11-02", "America/Los_Angeles")).toBe("2026-11-02T08:00:00.000Z");
    expect(zonedMidnightIso("2026-09-14", "Asia/Kolkata")).toBe("2026-09-13T18:30:00.000Z");
  });

  it("does date arithmetic on keys", () => {
    expect(addDaysToKey("2026-09-14", -7)).toBe("2026-09-07");
    expect(addDaysToKey("2026-12-28", 7)).toBe("2027-01-04");
  });

  it("falls back to UTC for missing or invalid zones", () => {
    expect(isValidTimeZone("Europe/Berlin")).toBe(true);
    expect(isValidTimeZone("Not/AZone")).toBe(false);
    expect(resolveTimeZone(null)).toBe("UTC");
    expect(resolveTimeZone("Not/AZone")).toBe("UTC");
    expect(resolveTimeZone("Europe/Berlin")).toBe("Europe/Berlin");
  });
});
