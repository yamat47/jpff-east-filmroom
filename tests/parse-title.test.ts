import { readFile } from "node:fs/promises";
import { beforeAll, describe, expect, it } from "vitest";
import { parseTitle } from "../scripts/parse-title.ts";
import { loadData } from "../src/lib/load-data.ts";
import type { Team } from "../src/lib/schema.ts";

const LAZARO: Team = { id: "kamakura-lazaro", name: "鎌倉ラザロ", aliases: [] };
const SEAGULLS: Team = { id: "tokai-seagulls", name: "東海シーガルズ", aliases: [] };
const TEAMS = [LAZARO, SEAGULLS];

const teamIds = (title: string, teams: readonly Team[] = TEAMS) =>
  parseTitle(title, teams).sides?.map((side) => side.teamId);

describe("parseTitle on the titles seen on the channel", () => {
  let teams: readonly Team[];
  let titles: string[];

  beforeAll(async () => {
    ({ teams } = await loadData(new URL("../data/", import.meta.url)));
    const fixture = await readFile(new URL("./fixtures/titles.txt", import.meta.url), "utf8");
    titles = fixture.split("\n").filter((line) => line !== "");
  });

  it.each([
    [
      "2026/10/25 甲府厚木タイタンズvsWG＆ブロンコス合同",
      "2026-10-25",
      ["kofu-atsugi-titans", "geese-broncos"],
    ],
    [
      "2026/10/11 ワイルドギース&東京ブロンコス vs 所沢アウトローズ",
      "2026-10-11",
      ["geese-broncos", "tokorozawa-outlaws"],
    ],
    [
      "2026/10/11 ブランディングス vs 甲府厚木タイタンズ",
      "2026-10-11",
      ["brandings", "kofu-atsugi-titans"],
    ],
    [
      "2026 10 4 川崎グリズリーズ vs 群馬スタリオンズ",
      "2026-10-04",
      ["kawasaki-grizzlies", "gunma-stallions"],
    ],
    ["2026 10 4 鎌倉ラザロ vs 東海シーガルズ", "2026-10-04", ["kamakura-lazaro", "tokai-seagulls"]],
  ])("reads %s", (title, date, expectedTeams) => {
    const parsed = parseTitle(title, teams);

    expect(parsed.date).toBe(date);
    expect(parsed.sides?.map((side) => side.teamId)).toEqual(expectedTeams);
    expect(parsed.part).toBeNull();
    expect(parsed.type).toBeNull();
  });

  it("resolves both spellings of the joint team to the same team", () => {
    const short = parseTitle("2026/10/25 甲府厚木タイタンズvsWG＆ブロンコス合同", teams);
    const long = parseTitle("2026/10/11 ワイルドギース&東京ブロンコス vs 所沢アウトローズ", teams);

    expect(short.sides?.[1].teamId).toBe("geese-broncos");
    expect(long.sides?.[0].teamId).toBe("geese-broncos");
  });

  it("reads a date and two known teams from every title collected in the fixture", () => {
    const unread = titles.filter((title) => {
      const parsed = parseTitle(title, teams);
      return (
        parsed.date === null ||
        parsed.sides === null ||
        parsed.sides.some((side) => side.teamId === null)
      );
    });

    expect(unread).toEqual([]);
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
    ["2027/1/10 第10回記念試合 鎌倉ラザロvs東海シーガルズ", "words the rules do not know"],
  ])("reads the first team of %s, which has %s before it", (title) => {
    expect(teamIds(title)).toEqual(["kamakura-lazaro", "tokai-seagulls"]);
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

  it("keeps unknown words before a team it does not know, for a person to sort out", () => {
    const parsed = parseTitle("2027/1/10 第10回記念試合 東京ブロンコスvs鎌倉ラザロ", TEAMS);

    expect(parsed.sides?.[0]).toEqual({ spelling: "第10回記念試合 東京ブロンコス", teamId: null });
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
