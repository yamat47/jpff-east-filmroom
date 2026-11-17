import { describe, expect, it } from "vitest";
import type { GameSummary, TeamSummary } from "../src/lib/game-summary.ts";
import { opponentIn, opponentsOf } from "../src/lib/opponents.ts";

const team = (id: string, name: string): TeamSummary => ({
  id,
  name,
  colors: ["#17181a", "#ffffff"],
});
const FALCONS = team("tachikawa-falcons", "立川ファルコンズ");
const LAZARO = team("kamakura-lazaro", "鎌倉ラザロ");
const SEAGULLS = team("tokai-seagulls", "東海シーガルズ");
const ULOWERS = team("urawa-ulowers", "浦和ウラワーズ");

// An ID that names its game, for the reading of a test. A real one says nothing of the game.
function game(date: string, first: TeamSummary, second: TeamSummary): GameSummary {
  return {
    id: `${date}-${first.id}-vs-${second.id}`,
    date,
    dateLabel: date,
    season: "2026-2027",
    type: "league",
    typeLabel: "リーグ戦",
    teams: [first, second],
    videoId: "aaaaaaaaaaa",
    videoCount: 1,
    live: null,
  };
}

const met = (games: GameSummary[]) =>
  opponentsOf(games, FALCONS.id).map((opponent) => [opponent.team.id, opponent.games]);

describe("opponentIn", () => {
  it.each([
    ["first", game("2026-11-01", FALCONS, LAZARO)],
    ["second", game("2026-11-01", LAZARO, FALCONS)],
  ])("finds the other team when the team is the %s of the two", (_side, played) => {
    expect(opponentIn(played, FALCONS.id)).toBe(LAZARO);
  });

  it("refuses a team that did not play the game", () => {
    expect(() => opponentIn(game("2026-11-01", LAZARO, SEAGULLS), FALCONS.id)).toThrow(
      "not a game of team",
    );
  });
});

describe("opponentsOf", () => {
  it("counts the games against each team, whichever side the team is on", () => {
    const games = [
      game("2026-11-01", FALCONS, LAZARO),
      game("2026-10-04", SEAGULLS, FALCONS),
      game("2026-09-13", LAZARO, FALCONS),
    ];

    expect(met(games)).toEqual([
      [LAZARO.id, 2],
      [SEAGULLS.id, 1],
    ]);
  });

  it("keeps the teams met equally often in the order the list first names them", () => {
    const games = [
      game("2026-11-01", FALCONS, SEAGULLS),
      game("2026-10-04", FALCONS, ULOWERS),
      game("2026-09-13", FALCONS, LAZARO),
    ];

    expect(met(games).map(([id]) => id)).toEqual([SEAGULLS.id, ULOWERS.id, LAZARO.id]);
  });

  it("leaves out a game the team did not play", () => {
    expect(met([game("2026-11-01", LAZARO, SEAGULLS)])).toEqual([]);
  });

  it("finds nobody in an empty list", () => {
    expect(met([])).toEqual([]);
  });
});
