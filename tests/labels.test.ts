import { describe, expect, it } from "vitest";
import type { TeamEntry } from "../src/lib/catalog.ts";
import {
  formatDate,
  formatDay,
  formatDuration,
  teamCountLabel,
  teamSpanLabel,
} from "../src/lib/labels.ts";

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

describe("formatDay", () => {
  it.each([
    ["2026-10-04", "10月4日(日)"],
    ["2022-01-16", "1月16日(日)"],
  ])("writes %s without its year as %s", (date, label) => {
    expect(formatDay(date)).toBe(label);
  });

  it("refuses what is not a date", () => {
    expect(() => formatDay("2026/10/04")).toThrow(TypeError);
  });
});

describe("the labels of a team", () => {
  const entry = (change: Partial<TeamEntry>): TeamEntry => ({
    team: { id: "wild-geese", name: "ワイルドギース", colors: ["#2459c9", "#2459c9"], aliases: [] },
    games: 22,
    firstSeason: "2021-2022",
    lastSeason: "2025-2026",
    current: false,
    ...change,
  });

  it.each<[string, Partial<TeamEntry>, string, string]>([
    [
      "a team of the newest season",
      { lastSeason: "2026-2027", current: true },
      "22試合",
      "2021-2022シーズンから",
    ],
    ["a team that plays no more", {}, "22試合・2025-2026まで", "2021-2022〜2025-2026シーズン"],
    [
      "a team of one past season",
      { games: 1, firstSeason: "2018-2019", lastSeason: "2018-2019" },
      "1試合・2018-2019のみ",
      "2018-2019シーズン",
    ],
  ])("say for %s how many games it has and when", (_case, change, count, span) => {
    expect(teamCountLabel(entry(change))).toBe(count);
    expect(teamSpanLabel(entry(change))).toBe(span);
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
