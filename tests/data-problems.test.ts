import { describe, expect, it } from "vitest";
import { findDataProblems } from "../src/lib/data-problems.ts";
import type { ExcludedVideo, Game, SiteData, Team, Video } from "../src/lib/schema.ts";

const COLORS: Team["colors"] = ["#17181a", "#ffffff"];

const LAZARO: Team = { id: "kamakura-lazaro", name: "鎌倉ラザロ", colors: COLORS, aliases: [] };
const SEAGULLS: Team = {
  id: "tokai-seagulls",
  name: "東海シーガルズ",
  colors: COLORS,
  aliases: [],
};
const JOINT: Team = {
  id: "geese-broncos",
  name: "ギースブロンコス合同チーム",
  colors: COLORS,
  aliases: ["WG&ブロンコス合同", "ワイルドギース&東京ブロンコス"],
};

function video(overrides: Partial<Video> = {}): Video {
  return {
    videoId: "aaaaaaaaaaa",
    part: 1,
    title: "2026 10 4 鎌倉ラザロ vs 東海シーガルズ",
    publishedAt: "2026-10-06T03:00:00Z",
    durationSec: 1797,
    live: null,
    ...overrides,
  };
}

function game(overrides: Partial<Game> = {}): Game {
  return {
    id: "2026-10-04-kamakura-lazaro-vs-tokai-seagulls",
    date: "2026-10-04",
    season: "2026-2027",
    type: "league",
    teams: ["kamakura-lazaro", "tokai-seagulls"],
    needsReview: false,
    videos: [video()],
    ...overrides,
  };
}

function data(
  parts: { teams?: Team[]; games?: Game[]; excluded?: ExcludedVideo[] } = {},
): SiteData {
  return {
    teams: parts.teams ?? [LAZARO, SEAGULLS, JOINT],
    seasons: [{ season: "2026-2027", games: parts.games ?? [game()] }],
    excluded: parts.excluded ?? [],
  };
}

describe("findDataProblems", () => {
  it("finds nothing in a game whose ID, season, teams and videos agree", () => {
    expect(findDataProblems(data())).toEqual([]);
  });

  it("reports a game whose team is not in teams.yaml", () => {
    const problems = findDataProblems(data({ teams: [LAZARO] }));

    expect(problems).toEqual([
      "game 2026-10-04-kamakura-lazaro-vs-tokai-seagulls: team tokai-seagulls is not in teams.yaml",
    ]);
  });

  it("reports a game ID that its date and teams do not make", () => {
    const problems = findDataProblems(data({ games: [game({ date: "2026-10-11" })] }));

    expect(problems).toEqual([
      "game 2026-10-04-kamakura-lazaro-vs-tokai-seagulls: its date and teams make the ID 2026-10-11-kamakura-lazaro-vs-tokai-seagulls",
    ]);
  });

  it("reports a game ID that depends on the order of the teams", () => {
    const problems = findDataProblems(
      data({ games: [game({ teams: ["tokai-seagulls", "kamakura-lazaro"] })] }),
    );

    expect(problems).toEqual([
      "game 2026-10-04-kamakura-lazaro-vs-tokai-seagulls: its date and teams make the ID 2026-10-04-tokai-seagulls-vs-kamakura-lazaro",
    ]);
  });

  it("reports the same game listed twice", () => {
    const problems = findDataProblems(
      data({ games: [game(), game({ videos: [video({ videoId: "bbbbbbbbbbb" })] })] }),
    );

    expect(problems).toEqual([
      "game 2026-10-04-kamakura-lazaro-vs-tokai-seagulls: the ID is used by more than one game",
    ]);
  });

  it("reports a game kept in the file of another season", () => {
    const problems = findDataProblems(data({ games: [game({ season: "2025-2026" })] }));

    expect(problems).toEqual([
      "game 2026-10-04-kamakura-lazaro-vs-tokai-seagulls: season 2025-2026 is in the file of 2026-2027",
    ]);
  });

  it("reports a video that belongs to two games", () => {
    const rematch = game({
      id: "2026-11-01-kamakura-lazaro-vs-tokai-seagulls",
      date: "2026-11-01",
    });

    expect(findDataProblems(data({ games: [game(), rematch] }))).toEqual([
      "video aaaaaaaaaaa: listed in game 2026-10-04-kamakura-lazaro-vs-tokai-seagulls and again in game 2026-11-01-kamakura-lazaro-vs-tokai-seagulls",
    ]);
  });

  it("reports a video that is both in a game and on the exclusion list", () => {
    const excluded = [{ videoId: "aaaaaaaaaaa", title: "開会式", reason: "not a game" }];

    expect(findDataProblems(data({ excluded }))).toEqual([
      "video aaaaaaaaaaa: listed in game 2026-10-04-kamakura-lazaro-vs-tokai-seagulls and again in the exclusion list",
    ]);
  });

  it("reports two videos of one game with the same part number", () => {
    const split = game({ videos: [video(), video({ videoId: "bbbbbbbbbbb" })] });

    expect(findDataProblems(data({ games: [split] }))).toEqual([
      "game 2026-10-04-kamakura-lazaro-vs-tokai-seagulls: two videos have the same part number",
    ]);
  });

  it("reports a split game whose videos are listed out of part order", () => {
    const split = game({
      videos: [video({ part: 2 }), video({ videoId: "bbbbbbbbbbb", part: 1 })],
    });

    expect(findDataProblems(data({ games: [split] }))).toEqual([
      "game 2026-10-04-kamakura-lazaro-vs-tokai-seagulls: its videos are not in the order of their part numbers",
    ]);
  });

  it("accepts a split game whose videos are numbered apart", () => {
    const split = game({ videos: [video(), video({ videoId: "bbbbbbbbbbb", part: 2 })] });

    expect(findDataProblems(data({ games: [split] }))).toEqual([]);
  });

  it("reports an alias registered for two teams", () => {
    const other: Team = {
      id: "wild-geese",
      name: "ワイルドギース",
      colors: COLORS,
      aliases: ["WG&ブロンコス合同"],
    };

    expect(findDataProblems(data({ teams: [LAZARO, SEAGULLS, JOINT, other] }))).toEqual([
      'team wild-geese: "WG&ブロンコス合同" already names team geese-broncos',
    ]);
  });

  it("treats a full-width and a half-width spelling of an alias as the same alias", () => {
    const other: Team = {
      id: "wild-geese",
      name: "ワイルドギース",
      colors: COLORS,
      aliases: ["ＷＧ＆ブロンコス合同"],
    };

    expect(findDataProblems(data({ teams: [LAZARO, SEAGULLS, JOINT, other] }))).toEqual([
      'team wild-geese: "WG&ブロンコス合同" already names team geese-broncos',
    ]);
  });

  it("reports an alias that is another team's name", () => {
    const other: Team = { id: "lazaro", name: "ラザロ", colors: COLORS, aliases: ["鎌倉ラザロ"] };

    expect(findDataProblems(data({ teams: [LAZARO, SEAGULLS, JOINT, other] }))).toEqual([
      'team lazaro: "鎌倉ラザロ" already names team kamakura-lazaro',
    ]);
  });

  it("accepts a team that repeats its own name among its aliases", () => {
    const repeated: Team = { ...LAZARO, aliases: ["鎌倉ラザロ"] };

    expect(findDataProblems(data({ teams: [repeated, SEAGULLS, JOINT] }))).toEqual([]);
  });

  it("reports two teams with the same ID", () => {
    const twin: Team = {
      id: "kamakura-lazaro",
      name: "鎌倉ラザロ II",
      colors: COLORS,
      aliases: [],
    };

    expect(findDataProblems(data({ teams: [LAZARO, SEAGULLS, JOINT, twin] }))).toEqual([
      "team kamakura-lazaro: the ID is used by more than one team",
    ]);
  });

  it("reports a game between a team and itself", () => {
    const mirror = game({
      id: "2026-10-04-kamakura-lazaro-vs-kamakura-lazaro",
      teams: ["kamakura-lazaro", "kamakura-lazaro"],
    });

    expect(findDataProblems(data({ games: [mirror] }))).toEqual([
      "game 2026-10-04-kamakura-lazaro-vs-kamakura-lazaro: both sides are team kamakura-lazaro",
    ]);
  });
});
