import { describe, expect, it } from "vitest";
import { seasonOf } from "../src/lib/season.ts";

describe("seasonOf", () => {
  it.each([
    ["2026-03-01", "2026-2027", "the first day of a season"],
    ["2026-10-04", "2026-2027", "an autumn league game"],
    ["2026-12-31", "2026-2027", "the last day of the calendar year"],
    ["2027-01-01", "2026-2027", "the first day of the next calendar year"],
    ["2027-02-28", "2026-2027", "the last day of a season"],
    ["2027-03-01", "2027-2028", "the day after, which starts the next season"],
    ["2028-02-29", "2027-2028", "the last day of a season that ends in a leap year"],
    ["2026-05-17", "2026-2027", "a spring game, which is not a season of its own"],
  ])("puts %s in %s (%s)", (date, season) => {
    expect(seasonOf(date)).toBe(season);
  });
});
