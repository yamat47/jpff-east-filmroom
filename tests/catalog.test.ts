import { describe, expect, it } from "vitest";
import {
  buildCatalog,
  gamesOfSeason,
  gamesOfTeam,
  relatedGames,
  teamsWithGames,
} from "../src/lib/catalog.ts";
import type { Game, SiteData, Team } from "../src/lib/schema.ts";
import { seasonOf } from "../src/lib/season.ts";

const COLORS: Team["colors"] = ["#17181a", "#ffffff"];

const team = (id: string, name: string): Team => ({ id, name, colors: COLORS, aliases: [] });
const TEAMS = [
  team("lazaro", "鎌倉ラザロ"),
  team("seagulls", "東海シーガルズ"),
  team("ulowers", "浦和ウラワーズ"),
  team("titans", "甲府厚木タイタンズ"),
];

function game(date: string, a: string, b: string): Game {
  return {
    id: `${date}-${a}-vs-${b}`,
    date,
    season: seasonOf(date),
    type: "league",
    teams: [a, b],
    needsReview: false,
    videos: [],
  };
}

function catalogOf(games: Game[]) {
  const seasons = [...new Set(games.map((item) => item.season))].sort();
  const data: SiteData = {
    teams: TEAMS,
    seasons: seasons.map((season) => ({
      season,
      games: games.filter((item) => item.season === season),
    })),
    excluded: [],
  };
  return buildCatalog(data);
}

const ids = (games: readonly Game[]) => games.map((item) => item.id);

describe("buildCatalog", () => {
  it("lists every game newest first across the season files", () => {
    const catalog = catalogOf([
      game("2025-10-05", "lazaro", "seagulls"),
      game("2026-10-04", "lazaro", "seagulls"),
      game("2026-09-13", "ulowers", "lazaro"),
    ]);

    expect(ids(catalog.games)).toEqual([
      "2026-10-04-lazaro-vs-seagulls",
      "2026-09-13-ulowers-vs-lazaro",
      "2025-10-05-lazaro-vs-seagulls",
    ]);
  });

  it("keeps two games of one day in the same order whatever order the file has them in", () => {
    const first = game("2026-10-04", "lazaro", "seagulls");
    const second = game("2026-10-04", "ulowers", "titans");

    expect(ids(catalogOf([second, first]).games)).toEqual(ids(catalogOf([first, second]).games));
  });

  it("lists the seasons that have a game, newest first", () => {
    const catalog = catalogOf([
      game("2025-10-05", "lazaro", "seagulls"),
      game("2027-01-10", "lazaro", "seagulls"),
      game("2018-07-08", "lazaro", "seagulls"),
    ]);

    expect(catalog.seasons).toEqual(["2026-2027", "2025-2026", "2018-2019"]);
  });
});

describe("gamesOfTeam and gamesOfSeason", () => {
  const catalog = catalogOf([
    game("2026-10-04", "lazaro", "seagulls"),
    game("2026-09-13", "ulowers", "lazaro"),
    game("2026-09-13", "seagulls", "titans"),
    game("2025-10-05", "seagulls", "lazaro"),
  ]);

  it("finds a team's games whichever side it is on", () => {
    expect(ids(gamesOfTeam(catalog, "lazaro"))).toEqual([
      "2026-10-04-lazaro-vs-seagulls",
      "2026-09-13-ulowers-vs-lazaro",
      "2025-10-05-seagulls-vs-lazaro",
    ]);
  });

  it("finds the games of one season only", () => {
    expect(ids(gamesOfSeason(catalog, "2025-2026"))).toEqual(["2025-10-05-seagulls-vs-lazaro"]);
  });

  it("counts the games of each team and leaves out a team without one", () => {
    const counted = teamsWithGames(catalogOf([game("2026-10-04", "lazaro", "seagulls")]));

    expect(counted.map((entry) => [entry.team.id, entry.games])).toEqual([
      ["lazaro", 1],
      ["seagulls", 1],
    ]);
  });
});

describe("relatedGames", () => {
  it("offers the other games of each team and of the season, without the game itself", () => {
    const shown = game("2026-10-04", "lazaro", "seagulls");
    const catalog = catalogOf([
      shown,
      game("2026-11-01", "ulowers", "lazaro"),
      game("2026-09-13", "seagulls", "titans"),
      game("2025-10-05", "seagulls", "lazaro"),
    ]);

    const related = relatedGames(catalog, shown);

    expect(ids(related.teams[0].games)).toEqual([
      "2026-11-01-ulowers-vs-lazaro",
      "2025-10-05-seagulls-vs-lazaro",
    ]);
    expect(ids(related.teams[1].games)).toEqual([
      "2026-09-13-seagulls-vs-titans",
      "2025-10-05-seagulls-vs-lazaro",
    ]);
    expect(ids(related.season.games)).toEqual([
      "2026-11-01-ulowers-vs-lazaro",
      "2026-09-13-seagulls-vs-titans",
    ]);
  });

  it("shows ten games of a longer list and says how many there are", () => {
    const shown = game("2026-12-20", "lazaro", "seagulls");
    const earlier = Array.from({ length: 13 }, (_, index) =>
      game(`2026-09-${String(index + 1).padStart(2, "0")}`, "lazaro", "ulowers"),
    );

    const { teams } = relatedGames(catalogOf([shown, ...earlier]), shown);

    expect(teams[0].games).toHaveLength(10);
    expect(teams[0].games[0]?.id).toBe("2026-09-13-lazaro-vs-ulowers");
    expect(teams[0].total).toBe(13);
  });

  it("offers nothing for a team whose only game is the one shown", () => {
    const shown = game("2026-10-04", "lazaro", "seagulls");

    expect(relatedGames(catalogOf([shown]), shown).teams[0]).toEqual({ games: [], total: 0 });
  });
});
