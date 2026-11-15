import { describe, expect, it } from "vitest";
import { formatDate, formatDuration } from "../src/lib/labels.ts";

describe("formatDate", () => {
  it.each([
    ["2026-10-04", "2026年10月4日(日)"],
    ["2025-01-11", "2025年1月11日(土)"],
    ["2019-07-15", "2019年7月15日(月)"],
    ["2028-02-29", "2028年2月29日(火)"],
  ])("writes %s as %s", (date, label) => {
    expect(formatDate(date)).toBe(label);
  });
});

describe("formatDate on what is not a date", () => {
  it.each(["2026-10-xx", "2026/10/04", "2026-10-4", ""])("refuses %s", (date) => {
    expect(() => formatDate(date)).toThrow(TypeError);
  });
});

describe("formatDuration", () => {
  it.each([
    [1797, "29:57"],
    [45, "0:45"],
    [600, "10:00"],
    [6060, "1:41:00"],
    [3605, "1:00:05"],
  ])("writes %i seconds as %s", (seconds, label) => {
    expect(formatDuration(seconds)).toBe(label);
  });
});
