import { describe, expect, it } from "vitest";
import { gameVideoIds, removeVideos, renderRemoval } from "../scripts/removed-videos.ts";
import type { Game, SiteData, Team, Video } from "../src/lib/schema.ts";

const COLORS: Team["colors"] = ["#17181a", "#ffffff"];
const TEAMS: Team[] = [
  { id: "kamakura-lazaro", name: "鎌倉ラザロ", colors: COLORS, aliases: [] },
  { id: "tokai-seagulls", name: "東海シーガルズ", colors: COLORS, aliases: [] },
];

const video = (videoId: string, part: number, title: string): Video => ({
  videoId,
  part,
  title,
  publishedAt: "2021-11-25T03:00:00Z",
  durationSec: 800,
  live: null,
});

// An ID that names its game, for the reading of a test. A real one says nothing of the game.
const game = (date: string, videos: Video[]): Game => ({
  id: `${date}-kamakura-lazaro-vs-tokai-seagulls`,
  date,
  season: "2021-2022",
  type: "league",
  teams: ["kamakura-lazaro", "tokai-seagulls"],
  needsReview: false,
  videos,
});

const SPLIT = game("2021-11-21", [
  video("first-half0", 1, "20211121 鎌倉vs東海 前半"),
  video("secondhalf0", 2, "20211121 鎌倉vs東海 後半"),
]);
const SINGLE = game("2021-12-05", [video("single00000", 1, "20211205 鎌倉vs東海")]);
const OTHER_SEASON: Game = {
  ...game("2026-10-04", [video("thisseason0", 1, "2026 10 4 鎌倉ラザロvs東海シーガルズ")]),
  season: "2026-2027",
};

const DATA: SiteData = {
  teams: TEAMS,
  seasons: [
    { season: "2021-2022", games: [SPLIT, SINGLE] },
    { season: "2026-2027", games: [OTHER_SEASON] },
  ],
  excluded: [{ videoId: "ceremony000", title: "開会式", reason: "not a game" }],
};

const ALL = gameVideoIds(DATA);
const without = (...gone: string[]) => new Set(ALL.filter((videoId) => !gone.includes(videoId)));

describe("gameVideoIds", () => {
  it("lists the videos of the games, and not the exclusion list", () => {
    expect(ALL).toEqual(["first-half0", "secondhalf0", "single00000", "thisseason0"]);
  });
});

describe("removeVideos", () => {
  it("changes nothing while YouTube returns every video", () => {
    expect(removeVideos(DATA, new Set(ALL))).toEqual({ files: new Map(), removed: [] });
  });

  it("takes a video out of its game, which keeps the others under their part numbers", () => {
    const { files, removed } = removeVideos(DATA, without("first-half0"));

    expect([...files.keys()]).toEqual(["2021-2022"]);
    expect(files.get("2021-2022")).toEqual([
      { ...SPLIT, videos: [video("secondhalf0", 2, "20211121 鎌倉vs東海 後半")] },
      SINGLE,
    ]);
    expect(removed).toEqual([{ game: SPLIT, videos: [SPLIT.videos[0]] }]);
  });

  it("removes a game whole when no video of it is left", () => {
    const { files, removed } = removeVideos(DATA, without("single00000"));

    expect(files.get("2021-2022")).toEqual([SPLIT]);
    expect(removed).toEqual([{ game: SINGLE, videos: SINGLE.videos }]);
  });

  it("refuses an answer without a single video, which is a fault and not a removal", () => {
    expect(() => removeVideos(DATA, new Set())).toThrow("YouTube returned none of the 4 videos");
    expect(() => removeVideos(DATA, new Set(["ceremony000"]))).toThrow("nothing is removed");
  });

  it("has nothing to remove from data without a video", () => {
    expect(removeVideos({ ...DATA, seasons: [] }, new Set()).removed).toEqual([]);
  });

  it("writes a season file that loses its last game as an empty list", () => {
    const { files } = removeVideos(DATA, without("thisseason0"));

    expect([...files]).toEqual([["2026-2027", []]]);
  });
});

describe("renderRemoval", () => {
  it("says that nothing is gone", () => {
    expect(renderRemoval(removeVideos(DATA, new Set(ALL)), TEAMS)).toBe(
      "Every video of every game is still on YouTube.\n",
    );
  });

  it("lists each game with the videos it loses and what is left of it", () => {
    const removal = removeVideos(DATA, without("first-half0", "single00000"));

    expect(renderRemoval(removal, TEAMS)).toBe(
      [
        "YouTube no longer returns 2 videos of 2 games: deleted, or made private.",
        "1 game loses every video, and with it the game page.",
        "",
        "| Date | Game | Removed | Left |",
        "| --- | --- | --- | --- |",
        "| 2021-11-21 | 鎌倉ラザロ vs 東海シーガルズ | 1: 20211121 鎌倉vs東海 前半 (`first-half0`) | 1 video |",
        "| 2021-12-05 | 鎌倉ラザロ vs 東海シーガルズ | 1: 20211205 鎌倉vs東海 (`single00000`) | none, the game is removed |",
        "",
      ].join("\n"),
    );
  });
});
