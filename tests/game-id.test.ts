import { describe, expect, it } from "vitest";
import { byDateAndTeams, newGameId } from "../src/lib/game-id.ts";
import { Game } from "../src/lib/schema.ts";

describe("newGameId", () => {
  it("makes an ID of eight letters and digits, one for each pick", () => {
    const picks = [0, 1, 2, 3, 4, 5, 6, 7];

    expect(newGameId(new Set(), () => picks.shift() ?? 0)).toBe("abcdefgh");
  });

  it("uses no letter or digit that is read as another", () => {
    let pick = 0;
    const ids = Array.from({ length: 8 }, () => newGameId(new Set(), (below) => pick++ % below));

    expect(ids.join("")).not.toMatch(/[01ilo]/);
    expect(new Set(ids.join("")).size).toBe(31);
  });

  it("makes an ID the schema of a game takes", () => {
    let pick = 0;
    const id = newGameId(new Set(), (below) => (pick++ * 7) % below);

    expect(Game.shape.id.safeParse(id).success).toBe(true);
  });

  it("gives no ID that is taken", () => {
    let picks = 0;
    const inTurn = (below: number) => Math.floor(picks++ / 8) % below;

    expect(newGameId(new Set(["aaaaaaaa", "bbbbbbbb"]), inTurn)).toBe("cccccccc");
  });
});

describe("byDateAndTeams", () => {
  const game = (id: string, date: string, teams: Game["teams"]): Game => ({
    id,
    date,
    season: "2026-2027",
    type: "league",
    teams,
    needsReview: false,
    videos: [],
  });

  it("orders games by date, then by their teams, whatever their IDs are", () => {
    const games = [
      game("aaaaaaaa", "2026-10-11", ["lazaro", "seagulls"]),
      game("bbbbbbbb", "2026-10-04", ["titans", "lazaro"]),
      game("cccccccc", "2026-10-04", ["lazaro", "titans"]),
      game("dddddddd", "2026-10-04", ["lazaro", "seagulls"]),
    ];

    expect(games.sort(byDateAndTeams).map((each) => each.id)).toEqual([
      "dddddddd",
      "cccccccc",
      "bbbbbbbb",
      "aaaaaaaa",
    ]);
  });

  it("orders two games of the same teams on one day by their IDs", () => {
    const games = [
      game("bbbbbbbb", "2026-10-04", ["lazaro", "seagulls"]),
      game("aaaaaaaa", "2026-10-04", ["lazaro", "seagulls"]),
    ];

    expect(games.sort(byDateAndTeams).map((each) => each.id)).toEqual(["aaaaaaaa", "bbbbbbbb"]);
  });
});
