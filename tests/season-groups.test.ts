import { describe, expect, it } from "vitest";
import { groupBySeason } from "../src/lib/season-groups.ts";

const game = (id: string, season: string) => ({ id, season });

describe("groupBySeason", () => {
  it("puts the games of each season under that season, the newest season first", () => {
    const games = [
      game("2026-10-04", "2026-2027"),
      game("2026-09-13", "2026-2027"),
      game("2025-12-21", "2025-2026"),
    ];

    expect(groupBySeason(games)).toEqual([
      { season: "2026-2027", games: [games[0], games[1]] },
      { season: "2025-2026", games: [games[2]] },
    ]);
  });

  it("keeps the games of a season in the order they were given", () => {
    const games = [
      game("2025-09-07", "2025-2026"),
      game("2025-12-21", "2025-2026"),
      game("2025-10-12", "2025-2026"),
    ];

    expect(groupBySeason(games)).toEqual([{ season: "2025-2026", games }]);
  });

  it("orders the seasons by season when a game dated later belongs to the earlier one", () => {
    // A final played on 2027-03-07 and set by hand into 2026-2027 comes before the first game
    // of 2027-2028 in a list that is newest first.
    const games = [
      game("2027-03-07", "2026-2027"),
      game("2027-03-01", "2027-2028"),
      game("2026-12-20", "2026-2027"),
    ];

    expect(groupBySeason(games)).toEqual([
      { season: "2027-2028", games: [games[1]] },
      { season: "2026-2027", games: [games[0], games[2]] },
    ]);
  });

  it("gives no group for an empty list", () => {
    expect(groupBySeason([])).toEqual([]);
  });
});
