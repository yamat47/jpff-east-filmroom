import { describe, expect, it } from "vitest";
import { Game, Team } from "../src/lib/schema.ts";

const GAME = {
  id: "2026-10-25-kofu-atsugi-titans-vs-geese-broncos",
  date: "2026-10-25",
  season: "2026-2027",
  type: "league",
  teams: ["kofu-atsugi-titans", "geese-broncos"],
  needsReview: false,
  videos: [
    {
      videoId: "XXXXXXXXXXX",
      part: 1,
      title: "2026/10/25 甲府厚木タイタンズvsWG＆ブロンコス合同",
      publishedAt: "2026-10-27T03:00:00Z",
      durationSec: 1797,
      live: null,
    },
  ],
};

describe("Game", () => {
  it("accepts the game the requirements give as an example", () => {
    expect(Game.safeParse(GAME).success).toBe(true);
  });

  it("accepts a scheduled live stream, whose length is not known yet", () => {
    const live = { status: "upcoming", scheduledStartTime: "2026-12-20T04:00:00Z" };
    const scheduled = { ...GAME, videos: [{ ...GAME.videos[0], durationSec: null, live }] };

    expect(Game.safeParse(scheduled).success).toBe(true);
  });

  it.each([
    ["a game type outside the four", { type: "friendly" }],
    ["a date that is not on the calendar", { date: "2026-02-30" }],
    ["a season whose years are not consecutive", { season: "2026-2028" }],
    ["one team", { teams: ["kofu-atsugi-titans"] }],
    ["three teams", { teams: ["kofu-atsugi-titans", "geese-broncos", "brandings"] }],
    ["no video", { videos: [] }],
    ["a field the model does not have, such as a score", { score: "21-14" }],
  ])("rejects %s", (_case, change) => {
    expect(Game.safeParse({ ...GAME, ...change }).success).toBe(false);
  });
});

describe("Team", () => {
  it("reads a team written without aliases as having none", () => {
    expect(Team.parse({ id: "kamakura-lazaro", name: "鎌倉ラザロ" }).aliases).toEqual([]);
  });

  it.each(["Kamakura-Lazaro", "kamakura_lazaro", "鎌倉ラザロ", "kamakura--lazaro", "-lazaro"])(
    "rejects the ID %s, which a URL would not keep as written",
    (id) => {
      expect(Team.safeParse({ id, name: "鎌倉ラザロ" }).success).toBe(false);
    },
  );
});
