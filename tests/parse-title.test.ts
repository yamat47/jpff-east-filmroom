import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { parseTitle } from "../scripts/parse-title.ts";
import { loadData } from "../src/lib/load-data.ts";
import type { Team } from "../src/lib/schema.ts";

const LAZARO: Team = { id: "kamakura-lazaro", name: "鎌倉ラザロ", aliases: [] };
const SEAGULLS: Team = { id: "tokai-seagulls", name: "東海シーガルズ", aliases: [] };
const TEAMS = [LAZARO, SEAGULLS];

const teamIds = (title: string, teams: readonly Team[] = TEAMS) =>
  parseTitle(title, teams).sides?.map((side) => side.teamId);

// Each line of the fixture is a title as written on the channel, then the date, the two team IDs
// and the part the rules must read from it, separated by tabs. "-" stands for what the rules
// leave unread: a date or a part the title does not carry, or a side that names no team in
// data/teams.yaml as it is written.
const FIXTURE = await readFile(new URL("./fixtures/titles.txt", import.meta.url), "utf8");
const { teams: REGISTERED_TEAMS } = await loadData(new URL("../data/", import.meta.url));

describe("parseTitle on the titles seen on the channel", () => {
  it("reads from every title in the fixture what the fixture says", () => {
    const lines = FIXTURE.split("\n").filter((line) => line !== "");
    const readings = lines.map((line) => {
      const title = line.split("\t")[0] ?? "";
      const parsed = parseTitle(title, REGISTERED_TEAMS);
      const sides = parsed.sides?.map((side) => side.teamId ?? "-") ?? ["-", "-"];
      return [title, parsed.date ?? "-", ...sides, parsed.part ?? "-"].join("\t");
    });

    expect(lines.length).toBeGreaterThan(0);
    expect(readings).toEqual(lines);
  });

  it("resolves both spellings of the joint team to the same team", () => {
    const short = parseTitle("2026/10/25 甲府厚木タイタンズvsWG＆ブロンコス合同", REGISTERED_TEAMS);
    const long = parseTitle(
      "2026/10/11 ワイルドギース&東京ブロンコスvs所沢アウトローズ",
      REGISTERED_TEAMS,
    );

    expect(short.sides?.[1].teamId).toBe("geese-broncos");
    expect(long.sides?.[0].teamId).toBe("geese-broncos");
  });
});

describe("parseTitle", () => {
  it.each([
    ["2026/10/4 鎌倉ラザロ vs 東海シーガルズ", "a slash and a one-digit day"],
    ["2026 10 04 鎌倉ラザロ vs 東海シーガルズ", "spaces"],
    ["2026-10-04 鎌倉ラザロ vs 東海シーガルズ", "hyphens"],
    ["2026.10.4 鎌倉ラザロ vs 東海シーガルズ", "dots"],
    ["20261004 鎌倉ラザロ vs 東海シーガルズ", "eight digits with nothing in between"],
    [
      "２０２６／１０／４　鎌倉ラザロ　ｖｓ　東海シーガルズ",
      "full-width digits, slashes and spaces",
    ],
  ])("reads the date of %s (%s)", (title) => {
    expect(parseTitle(title, TEAMS).date).toBe("2026-10-04");
  });

  it.each([
    ["鎌倉ラザロ vs 東海シーガルズ", "no date"],
    ["2026/2/30 鎌倉ラザロ vs 東海シーガルズ", "a day the month does not have"],
    ["2026/13/1 鎌倉ラザロ vs 東海シーガルズ", "a month the year does not have"],
    ["鎌倉ラザロ vs 東海シーガルズ 2026/10/4", "a date that is not at the start"],
  ])("reads no date from %s (%s)", (title) => {
    expect(parseTitle(title, TEAMS).date).toBeNull();
  });

  it("still reads the teams of a title without a date", () => {
    expect(teamIds("鎌倉ラザロ vs 東海シーガルズ")).toEqual(["kamakura-lazaro", "tokai-seagulls"]);
  });

  it("still reads the teams of a title whose date is not on the calendar", () => {
    expect(teamIds("2026/2/30 鎌倉ラザロ vs 東海シーガルズ")).toEqual([
      "kamakura-lazaro",
      "tokai-seagulls",
    ]);
  });

  it.each([
    ["2026/10/4 鎌倉ラザロvs東海シーガルズ", "no spaces around vs"],
    ["2026/10/4 鎌倉ラザロ VS 東海シーガルズ", "upper case"],
    ["2026/10/4 鎌倉ラザロ vs. 東海シーガルズ", "a dot after vs"],
    ["2026/10/4 鎌倉ラザロ  vs  東海シーガルズ", "two spaces on each side"],
  ])("splits the matchup of %s (%s)", (title) => {
    expect(teamIds(title)).toEqual(["kamakura-lazaro", "tokai-seagulls"]);
  });

  it("keeps the order of the title", () => {
    expect(teamIds("2026/10/4 東海シーガルズ vs 鎌倉ラザロ")).toEqual([
      "tokai-seagulls",
      "kamakura-lazaro",
    ]);
  });

  it.each([
    ["2026/10/4 開会式", "no vs"],
    ["2026/10/4 鎌倉ラザロ vs", "nothing after vs"],
    ["2026/10/4 vs 東海シーガルズ", "nothing before vs"],
  ])("reads no matchup from %s (%s)", (title) => {
    expect(parseTitle(title, TEAMS).sides).toBeNull();
  });

  it("reports the spelling of a side that names no known team", () => {
    const parsed = parseTitle("2026/10/4 鎌倉ラザロ vs 横浜タイタンズ", TEAMS);

    expect(parsed.sides).toEqual([
      { spelling: "鎌倉ラザロ", teamId: "kamakura-lazaro" },
      { spelling: "横浜タイタンズ", teamId: null },
    ]);
  });

  it.each([
    ["2025/12/07 プレーオフ 鎌倉ラザロvs東海シーガルズ", "the kind of game"],
    ["2025準決勝　鎌倉ラザロvs東海シーガルズ", "a year and the round, with a full-width space"],
    ["2027/1/10 Ocean Bowl 鎌倉ラザロvs東海シーガルズ", "the name of a bowl game"],
  ])("reads the first team of %s, which has %s before it", (title) => {
    expect(teamIds(title)).toEqual(["kamakura-lazaro", "tokai-seagulls"]);
  });

  it.each([
    ["20221009-1 鎌倉ラザロvs東海シーガルズ", "2022-10-09", "the game's number after a hyphen"],
    ["20220904 1 鎌倉ラザロvs東海シーガルズ", "2022-09-04", "the number after a space"],
    ["20211114 2鎌倉ラザロvs東海シーガルズ", "2021-11-14", "the number with no space after it"],
    ["20231029 ① 鎌倉ラザロ VS 東海シーガルズ", "2023-10-29", "a circled number"],
    ["20230827 2HD 鎌倉ラザロvs東海シーガルズ", "2023-08-27", "the number and HD"],
    [
      "2022 10 23 第１試合 鎌倉ラザロVS東海シーガルズ",
      "2022-10-23",
      "the game of the day in words",
    ],
    ["20240825第1節鎌倉ラザロvs東海シーガルズ", "2024-08-25", "the round, with no space around it"],
    ["20231203 第13節第2試合 鎌倉ラザロvs東海シーガルズ", "2023-12-03", "the round and the game"],
    ["20240908-鎌倉ラザロvs東海シーガルズ", "2024-09-08", "a hyphen alone"],
    ["20241110_鎌倉ラザロvs東海シーガルズ", "2024-11-10", "an underscore alone"],
    ["20220130JPFF決勝戦 鎌倉ラザロvs東海シーガルズ", "2022-01-30", "the occasion after the date"],
  ])("reads %s as a game of %s (%s between the date and the first team)", (title, date) => {
    const parsed = parseTitle(title, TEAMS);

    expect(parsed.date).toBe(date);
    expect(parsed.sides?.map((side) => side.teamId)).toEqual(["kamakura-lazaro", "tokai-seagulls"]);
    expect(parsed.part).toBeNull();
  });

  it("does not take the start of a number that is not a date for the game's number", () => {
    const parsed = parseTitle("2022016 第2試合 鎌倉ラザロvs東海シーガルズ", TEAMS);

    expect(parsed.date).toBeNull();
    expect(parsed.sides?.[0]).toEqual({ spelling: "2022016 第2試合 鎌倉ラザロ", teamId: null });
  });

  it("keeps a digit that starts a registered team's name", () => {
    const second: Team = { id: "lazaro-2", name: "2鎌倉ラザロ", aliases: [] };

    expect(teamIds("20211114 2鎌倉ラザロvs東海シーガルズ", [...TEAMS, second])).toEqual([
      "lazaro-2",
      "tokai-seagulls",
    ]);
  });

  it("reads a year and a round as no date, which leaves the date to the caller", () => {
    const parsed = parseTitle("2025準決勝　鎌倉ラザロvs東海シーガルズ", TEAMS);

    expect(parsed.date).toBeNull();
    expect(parsed.type).toBe("playoff");
  });

  it("leaves the kind of game out of the spelling of a team it does not know", () => {
    const parsed = parseTitle("2025/11/30 プレーオフ 東京ブロンコスvs鎌倉ラザロ", TEAMS);

    expect(parsed.sides?.[0]).toEqual({ spelling: "東京ブロンコス", teamId: null });
  });

  it("does not drop words that do not name an occasion, even before a team it knows", () => {
    const parsed = parseTitle("2027/1/10 第10回記念試合 鎌倉ラザロvs東海シーガルズ", TEAMS);

    expect(parsed.sides?.[0]).toEqual({ spelling: "第10回記念試合 鎌倉ラザロ", teamId: null });
  });

  it("does not read a joint team as the team its spelling ends with", () => {
    const broncos: Team = { id: "tokyo-broncos", name: "東京ブロンコス", aliases: [] };
    const parsed = parseTitle("2026/10/11 ワイルドギース & 東京ブロンコス vs 鎌倉ラザロ", [
      ...TEAMS,
      broncos,
    ]);

    expect(parsed.sides?.[0]).toEqual({
      spelling: "ワイルドギース & 東京ブロンコス",
      teamId: null,
    });
  });

  it("drops the occasion before a team whose own name has a keyword in it", () => {
    const parsed = parseTitle("2027/2/7 オールスター 関東選抜 vs 関西選抜", TEAMS);

    expect(parsed.sides?.map((side) => side.spelling)).toEqual(["関東選抜", "関西選抜"]);
  });

  it("keeps a keyword that is part of a registered team's name", () => {
    const allStars: Team = { id: "east-allstars", name: "オールスター EAST", aliases: [] };

    expect(teamIds("2027/2/7 オールスター EAST vs 鎌倉ラザロ", [...TEAMS, allStars])).toEqual([
      "east-allstars",
      "kamakura-lazaro",
    ]);
  });

  it("does not take part of a longer name for a team", () => {
    expect(teamIds("2026/10/4 鎌倉ラザロ vs 東海シーガルズOB")).toEqual(["kamakura-lazaro", null]);
  });

  it.each([
    ["2026/10/4 鎌倉ラザロ vs 東海シーガルズ 前半", 1],
    ["2026/10/4 鎌倉ラザロ vs 東海シーガルズ 後半", 2],
    ["2026/10/4 鎌倉ラザロ vs 東海シーガルズ後半", 2],
    ["2026/10/4 鎌倉ラザロ vs 東海シーガルズ Part 2", 2],
    ["2026/10/4 鎌倉ラザロ vs 東海シーガルズ part3", 3],
    ["2026/10/4 鎌倉ラザロ vs 東海シーガルズ ②", 2],
  ])("reads the part of %s and still finds the second team", (title, part) => {
    const parsed = parseTitle(title, TEAMS);

    expect(parsed.part).toBe(part);
    expect(parsed.sides?.[1].teamId).toBe("tokai-seagulls");
  });

  it.each([
    ["1Q 鎌倉ラザロvs東海シーガルズ", 1, "a quarter before everything else"],
    ["４Ｑ　鎌倉ラザロvs東海シーガルズ", 4, "a quarter in full-width letters"],
    ["2021 12 19鎌倉ラザロvs東海シーガルズ 3Q", 3, "a quarter at the end"],
    ["20211114 1鎌倉ラザロvs東海シーガルズ前半2Q", 2, "a quarter named with its half"],
    ["20231029 ②【後半】鎌倉ラザロ VS 東海シーガルズ", 2, "the half in brackets before the teams"],
    ["20221009-1前半 鎌倉ラザロvs東海シーガルズ 前半", 1, "the half before and after the teams"],
  ])("reads %s as part %i (%s)", (title, part) => {
    const parsed = parseTitle(title, TEAMS);

    expect(parsed.part).toBe(part);
    expect(parsed.sides?.map((side) => side.teamId)).toEqual(["kamakura-lazaro", "tokai-seagulls"]);
  });

  it.each([
    ["2025準決勝 鎌倉ラザロ vs 東海シーガルズ 2025", "a year"],
    ["2026/10/4 鎌倉ラザロ vs 東海シーガルズ Part 0", "a part before the first"],
  ])("reads no part from %s, which ends with %s", (title) => {
    const parsed = parseTitle(title, TEAMS);

    expect(parsed.part).toBeNull();
    expect(parsed.sides?.[1].teamId).toBeNull();
  });

  it("takes a trailing number for the team when a team is spelled that way", () => {
    const second: Team = { id: "seagulls-2", name: "東海シーガルズ 2", aliases: [] };
    const parsed = parseTitle("2026/10/4 鎌倉ラザロ vs 東海シーガルズ 2", [...TEAMS, second]);

    expect(parsed.sides?.[1].teamId).toBe("seagulls-2");
    expect(parsed.part).toBeNull();
  });

  it.each([
    ["2026/12/6 プレーオフ 鎌倉ラザロ vs 東海シーガルズ", "playoff"],
    ["2026/12/13 準決勝 鎌倉ラザロ vs 東海シーガルズ", "playoff"],
    ["2027/1/10 Ocean Bowl 鎌倉ラザロ vs 東海シーガルズ", "playoff"],
    ["2027/1/17 百万石ボウル 鎌倉ラザロ vs 東海シーガルズ", "playoff"],
    ["2027/2/7 オールスター EAST vs WEST", "allstar"],
    ["2027/2/7 オールスターボウル EAST vs WEST", "allstar"],
    ["2026/5/17 練習試合 鎌倉ラザロ vs 東海シーガルズ", "other"],
  ])("reads the type of %s as %s", (title, type) => {
    expect(parseTitle(title, TEAMS).type).toBe(type);
  });

  it("reads no type from a title without a keyword, which leaves it to the caller", () => {
    expect(parseTitle("2026/10/4 鎌倉ラザロ vs 東海シーガルズ", TEAMS).type).toBeNull();
  });
});
