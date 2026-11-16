import { describe, expect, it } from "vitest";
import {
  buildCatalog,
  gamesAround,
  gamesOfSeason,
  gamesOfTeam,
  otherMeetings,
  sameDayGames,
  seasonsWithGames,
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
});

describe("seasonsWithGames", () => {
  it("counts the games of each season, the newest season first", () => {
    const catalog = catalogOf([
      game("2025-10-05", "lazaro", "seagulls"),
      game("2026-10-04", "lazaro", "seagulls"),
      game("2026-09-13", "ulowers", "lazaro"),
    ]);

    expect(seasonsWithGames(catalog)).toEqual([
      { season: "2026-2027", games: 2 },
      { season: "2025-2026", games: 1 },
    ]);
  });
});

describe("teamsWithGames", () => {
  it("counts the games of each team and leaves out a team without one", () => {
    const counted = teamsWithGames(catalogOf([game("2026-10-04", "lazaro", "seagulls")]));

    expect(counted.map((entry) => [entry.team.id, entry.games])).toEqual([
      ["lazaro", 1],
      ["seagulls", 1],
    ]);
  });

  it("says in which seasons a team has games", () => {
    const [lazaro] = teamsWithGames(
      catalogOf([
        game("2026-10-04", "lazaro", "seagulls"),
        game("2024-10-06", "lazaro", "seagulls"),
        game("2022-01-16", "lazaro", "seagulls"),
      ]),
    );

    expect(lazaro).toMatchObject({ firstSeason: "2021-2022", lastSeason: "2026-2027" });
  });

  it("puts the teams of the newest season before the teams that play no more", () => {
    const entries = teamsWithGames(
      catalogOf([
        game("2026-10-04", "ulowers", "titans"),
        game("2025-10-05", "lazaro", "seagulls"),
      ]),
    );

    expect(entries.map((entry) => [entry.team.id, entry.current])).toEqual([
      ["ulowers", true],
      ["titans", true],
      ["lazaro", false],
      ["seagulls", false],
    ]);
  });
});

describe("otherMeetings", () => {
  it("finds the other games of the same two teams, whichever side each is on", () => {
    const shown = game("2026-10-04", "lazaro", "seagulls");
    const catalog = catalogOf([
      shown,
      game("2025-10-05", "seagulls", "lazaro"),
      game("2024-12-15", "lazaro", "seagulls"),
      game("2026-09-13", "ulowers", "lazaro"),
      game("2026-09-13", "seagulls", "titans"),
    ]);

    expect(ids(otherMeetings(catalog, shown))).toEqual([
      "2025-10-05-seagulls-vs-lazaro",
      "2024-12-15-lazaro-vs-seagulls",
    ]);
  });
});

describe("sameDayGames", () => {
  it("finds the other games of the day and not the game itself", () => {
    const shown = game("2026-10-04", "lazaro", "seagulls");
    const catalog = catalogOf([
      shown,
      game("2026-10-04", "ulowers", "titans"),
      game("2026-10-11", "ulowers", "titans"),
    ]);

    expect(ids(sameDayGames(catalog, shown))).toEqual(["2026-10-04-ulowers-vs-titans"]);
  });
});

describe("gamesAround", () => {
  const day = (index: number) => `2026-09-${String(index).padStart(2, "0")}`;
  const season = Array.from({ length: 12 }, (_, index) =>
    game(day(index + 1), "lazaro", "ulowers"),
  );
  const catalog = catalogOf([...season, game("2026-09-06", "seagulls", "titans")]);

  it("shows the game with the two games after it and the five before it, newest first", () => {
    const shown = season[7];
    if (shown === undefined) throw new Error("the season has twelve games");

    expect(gamesAround(catalog, shown, "lazaro").map((item) => item.date)).toEqual(
      [10, 9, 8, 7, 6, 5, 4, 3].map(day),
    );
  });

  it("starts at the newest game when nothing follows the one shown", () => {
    const shown = season[11];
    if (shown === undefined) throw new Error("the season has twelve games");

    expect(gamesAround(catalog, shown, "lazaro").map((item) => item.date)).toEqual(
      [12, 11, 10, 9, 8, 7].map(day),
    );
  });

  it("shows a team's only game alone", () => {
    const shown = game("2026-10-04", "lazaro", "seagulls");

    expect(ids(gamesAround(catalogOf([shown]), shown, "seagulls"))).toEqual([shown.id]);
  });

  it("refuses a team that did not play the game", () => {
    const shown = game("2026-10-04", "lazaro", "seagulls");

    expect(() => gamesAround(catalogOf([shown]), shown, "ulowers")).toThrow("not a game of team");
  });
});
