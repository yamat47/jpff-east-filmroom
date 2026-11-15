import { describe, expect, it } from "vitest";
import { buildCatalog } from "../src/lib/catalog.ts";
import { summarize } from "../src/lib/game-summary.ts";
import type { Game, Video } from "../src/lib/schema.ts";

const video = (videoId: string, part: number): Video => ({
  videoId,
  part,
  title: "20211219 ブランディングスvsWG",
  publishedAt: "2021-12-20T03:00:00Z",
  durationSec: 600,
  live: null,
});

const GAME: Game = {
  id: "2021-12-19-brandings-vs-wild-geese",
  date: "2021-12-19",
  season: "2021-2022",
  type: "playoff",
  teams: ["brandings", "wild-geese"],
  needsReview: false,
  videos: [video("aaaaaaaaaaa", 1), video("bbbbbbbbbbb", 2)],
};

const catalog = buildCatalog({
  teams: [
    { id: "brandings", name: "ブランディングス", aliases: ["ブラ"] },
    { id: "wild-geese", name: "ワイルドギース", aliases: ["WG"] },
  ],
  seasons: [{ season: "2021-2022", games: [GAME] }],
  excluded: [],
});

describe("summarize", () => {
  it("gives a card the names of the teams, the words for date and type, and the first video", () => {
    expect(summarize(catalog, GAME)).toEqual({
      id: "2021-12-19-brandings-vs-wild-geese",
      date: "2021-12-19",
      dateLabel: "2021年12月19日(日)",
      season: "2021-2022",
      type: "playoff",
      typeLabel: "プレーオフ",
      teams: [
        { id: "brandings", name: "ブランディングス" },
        { id: "wild-geese", name: "ワイルドギース" },
      ],
      videoId: "aaaaaaaaaaa",
      videoCount: 2,
    });
  });
});
