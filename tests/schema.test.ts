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

  it("rejects a video without a length that is not a live stream", () => {
    const unknown = { ...GAME, videos: [{ ...GAME.videos[0], durationSec: null }] };

    expect(Game.safeParse(unknown).success).toBe(false);
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
  const TEAM = { id: "kamakura-lazaro", name: "鎌倉ラザロ", colors: ["#d8232a", "#17181a"] };

  it("reads a team written without aliases as having none", () => {
    expect(Team.parse(TEAM).aliases).toEqual([]);
  });

  it.each([
    ["a name", { ...TEAM, name: "　" }],
    ["an alias", { ...TEAM, aliases: [" "] }],
  ])("rejects %s made of spaces alone, which no title can spell", (_case, team) => {
    expect(Team.safeParse(team).success).toBe(false);
  });

  it.each(["Kamakura-Lazaro", "kamakura_lazaro", "鎌倉ラザロ", "kamakura--lazaro", "-lazaro"])(
    "rejects the ID %s, which a URL would not keep as written",
    (id) => {
      expect(Team.safeParse({ ...TEAM, id }).success).toBe(false);
    },
  );

  it.each([
    ["no colours", undefined],
    ["one colour", ["#d8232a"]],
    ["three colours", ["#d8232a", "#17181a", "#ffffff"]],
    ["a colour by name", ["red", "#17181a"]],
    ["a colour of three digits", ["#d22", "#17181a"]],
    ["a colour in upper case", ["#D8232A", "#17181a"]],
  ])("rejects a team with %s", (_case, colors) => {
    expect(Team.safeParse({ ...TEAM, colors }).success).toBe(false);
  });
});
