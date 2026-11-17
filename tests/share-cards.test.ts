import { describe, expect, it } from "vitest";
import { buildCatalog } from "../src/lib/catalog.ts";
import type { Game, SiteData, Team } from "../src/lib/schema.ts";
import { shareCardsOf } from "../src/lib/share-cards.ts";

const COLORS: Team["colors"] = ["#d8232a", "#17181a"];
const team = (id: string, name: string): Team => ({ id, name, colors: COLORS, aliases: [] });

const GAME: Game = {
  id: "k7m2x9qd",
  date: "2026-10-04",
  season: "2026-2027",
  type: "league",
  teams: ["lazaro", "seagulls"],
  needsReview: false,
  videos: [
    {
      videoId: "aaaaaaaaaaa",
      part: 1,
      title: "2026 10 4 鎌倉ラザロvs東海シーガルズ",
      publishedAt: "2026-10-06T03:00:00Z",
      durationSec: 1538,
      live: null,
    },
  ],
};

const DATA: SiteData = {
  teams: [
    team("lazaro", "鎌倉ラザロ"),
    team("seagulls", "東海シーガルズ"),
    team("titans", "甲府厚木タイタンズ"),
  ],
  seasons: [{ season: "2026-2027", games: [GAME] }],
  excluded: [],
};

describe("shareCardsOf", () => {
  const cards = shareCardsOf(buildCatalog(DATA));
  const lazaro = { id: "lazaro", name: "鎌倉ラザロ", colors: COLORS };
  const seagulls = { id: "seagulls", name: "東海シーガルズ", colors: COLORS };

  it("gives the top page the picture of the site", () => {
    expect(cards.get("/")).toEqual({ kind: "site" });
  });

  it("gives a game page its date and its two teams, in the order of the game", () => {
    expect(cards.get("/games/k7m2x9qd/")).toEqual({
      kind: "game",
      dateLabel: "2026/10/04",
      teams: [lazaro, seagulls],
    });
  });

  it("gives a team page its team, and a season page and each list their title", () => {
    expect(cards.get("/teams/lazaro/")).toEqual({ kind: "team", team: lazaro });
    expect(cards.get("/seasons/2026-2027/")).toEqual({ kind: "title", title: "2026-2027シーズン" });
    expect(cards.get("/games/")).toEqual({ kind: "title", title: "すべての試合" });
    expect(cards.get("/teams/")).toEqual({ kind: "title", title: "チーム" });
    expect(cards.get("/seasons/")).toEqual({ kind: "title", title: "シーズン" });
    expect(cards.get("/about/")).toEqual({ kind: "title", title: "このサイトについて" });
  });

  it("has no picture for a team without a game, which has no page", () => {
    expect(cards.has("/teams/titans/")).toBe(false);
  });

  it("names every page by a path that begins and ends with a slash", () => {
    expect([...cards.keys()].filter((path) => !/^\/(.+\/)?$/.test(path))).toEqual([]);
  });
});
