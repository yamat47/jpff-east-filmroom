import { describe, expect, it } from "vitest";
import { buildCatalog } from "../src/lib/catalog.ts";
import { summarize } from "../src/lib/game-summary.ts";
import type { Game, Team, Video } from "../src/lib/schema.ts";

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

const BRANDINGS: Team["colors"] = ["#17181a", "#d0202e"];
const WILD_GEESE: Team["colors"] = ["#2459c9", "#2459c9"];

const catalog = buildCatalog({
  teams: [
    { id: "brandings", name: "ブランディングス", colors: BRANDINGS, aliases: ["ブラ"] },
    { id: "wild-geese", name: "ワイルドギース", colors: WILD_GEESE, aliases: ["WG"] },
  ],
  seasons: [{ season: "2021-2022", games: [GAME] }],
  excluded: [],
});

describe("summarize", () => {
  it("gives a list the names and colours of the teams, the words for date and type, and the first video", () => {
    expect(summarize(catalog, GAME)).toEqual({
      id: "2021-12-19-brandings-vs-wild-geese",
      date: "2021-12-19",
      dateLabel: "2021/12/19",
      season: "2021-2022",
      type: "playoff",
      typeLabel: "プレーオフ",
      teams: [
        { id: "brandings", name: "ブランディングス", colors: BRANDINGS },
        { id: "wild-geese", name: "ワイルドギース", colors: WILD_GEESE },
      ],
      videoId: "aaaaaaaaaaa",
      videoCount: 2,
      live: null,
    });
  });

  it("gives a stream that has not ended with its start as Japan reads it", () => {
    const live = { status: "upcoming", scheduledStartTime: "2026-12-20T04:00:00Z" } as const;
    const scheduled = {
      ...GAME,
      videos: [{ ...video("aaaaaaaaaaa", 1), durationSec: null, live }],
    };

    expect(summarize(catalog, scheduled).live).toEqual({ ...live, startLabel: "13:00" });
  });

  it("gives no stream for one that has ended", () => {
    const live = { status: "archived", scheduledStartTime: "2026-12-20T04:00:00Z" } as const;
    const ended = { ...GAME, videos: [{ ...video("aaaaaaaaaaa", 1), live }] };

    expect(summarize(catalog, ended).live).toBeNull();
  });
});
