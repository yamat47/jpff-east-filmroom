import { describe, expect, it } from "vitest";
import type { TeamEntry } from "../src/lib/catalog.ts";
import { formatDate, formatDuration, teamCountLabel, teamSpanLabel } from "../src/lib/labels.ts";

describe("formatDate", () => {
  it.each([
    ["2026-10-04", "2026/10/04"],
    ["2025-01-11", "2025/01/11"],
    ["2028-02-29", "2028/02/29"],
  ])("writes %s as %s", (date, label) => {
    expect(formatDate(date)).toBe(label);
  });

  it.each(["2026-10-xx", "2026/10/04", "2026-10-4", ""])(
    "refuses %s, which is not a date",
    (date) => {
      expect(() => formatDate(date)).toThrow(TypeError);
    },
  );
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
