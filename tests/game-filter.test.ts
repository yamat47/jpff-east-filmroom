import { describe, expect, it } from "vitest";
import {
  isFiltered,
  matchesSelection,
  type Offered,
  type Selection,
  selectionFrom,
} from "../src/lib/game-filter.ts";
import type { GameSummary } from "../src/lib/game-summary.ts";

const OFFERED: Offered = {
  seasons: ["2026-2027", "2025-2026"],
  teams: ["kamakura-lazaro", "tokai-seagulls"],
  types: ["league", "playoff"],
};

function summary(overrides: Partial<GameSummary> = {}): GameSummary {
  return {
    id: "2026-10-04-kamakura-lazaro-vs-tokai-seagulls",
    date: "2026-10-04",
    dateLabel: "2026年10月4日(日)",
    dayLabel: "10月4日(日)",
    season: "2026-2027",
    type: "league",
    typeLabel: "リーグ戦",
    teams: [
      { id: "kamakura-lazaro", name: "鎌倉ラザロ", colors: ["#d8232a", "#17181a"] },
      { id: "tokai-seagulls", name: "東海シーガルズ", colors: ["#1b2a4a", "#ffffff"] },
    ],
    videoId: "aaaaaaaaaaa",
    videoCount: 1,
    ...overrides,
  };
}

describe("selectionFrom", () => {
  it("leaves every filter open for a URL without a query", () => {
    expect(selectionFrom("", OFFERED)).toEqual({ season: null, team: null, type: null });
  });

  it("reads the three filters from one query", () => {
    expect(selectionFrom("?season=2026-2027&team=kamakura-lazaro&type=league", OFFERED)).toEqual({
      season: "2026-2027",
      team: "kamakura-lazaro",
      type: "league",
    });
  });

  it.each([
    ["?season=2019-2020", "a season the list has no game of"],
    ["?team=yokohama-titans", "a team the page does not offer"],
    ["?type=friendly", "a type the model does not have"],
    ["?type=allstar", "a type no game of the list has"],
    ["?season=&team=&type=", "empty values"],
  ])("selects nothing for %s (%s)", (search) => {
    expect(selectionFrom(search, OFFERED)).toEqual({ season: null, team: null, type: null });
  });

  it("ignores a filter the page does not show, as a season page does with the team", () => {
    const typeOnly: Offered = { seasons: [], teams: [], types: ["league", "playoff"] };

    expect(selectionFrom("?season=2026-2027&team=kamakura-lazaro&type=playoff", typeOnly)).toEqual({
      season: null,
      team: null,
      type: "playoff",
    });
  });

  it("keeps the filters it knows beside a value it does not", () => {
    expect(selectionFrom("?season=2026-2027&team=nobody", OFFERED)).toEqual({
      season: "2026-2027",
      team: null,
      type: null,
    });
  });
});

describe("matchesSelection", () => {
  const open = { season: null, team: null, type: null };

  it("keeps every game when nothing is selected", () => {
    expect(matchesSelection(summary(), open)).toBe(true);
  });

  it.each(["kamakura-lazaro", "tokai-seagulls"])("finds a game of %s on either side", (team) => {
    expect(matchesSelection(summary(), { ...open, team })).toBe(true);
  });

  it.each<[Partial<Selection>, string]>([
    [{ season: "2025-2026" }, "another season"],
    [{ team: "urawa-ulowers" }, "a team that did not play"],
    [{ type: "playoff" }, "another type"],
  ])("drops a game for %o (%s)", (change) => {
    expect(matchesSelection(summary(), { ...open, ...change })).toBe(false);
  });

  it("needs every selected filter to match at once", () => {
    const selection = { season: "2026-2027", team: "kamakura-lazaro", type: "playoff" as const };

    expect(matchesSelection(summary(), selection)).toBe(false);
    expect(matchesSelection(summary({ type: "playoff", typeLabel: "プレーオフ" }), selection)).toBe(
      true,
    );
  });
});

describe("isFiltered", () => {
  it("is false only when all three filters are open", () => {
    expect(isFiltered({ season: null, team: null, type: null })).toBe(false);
    expect(isFiltered({ season: null, team: null, type: "league" })).toBe(true);
  });
});
