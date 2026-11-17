import { beforeEach, describe, expect, it } from "vitest";
import { draftGames, renderDraft, seasonFilesOf } from "../scripts/draft-games.ts";
import type { ChannelVideo } from "../scripts/youtube.ts";
import type { Game, SiteData, Team } from "../src/lib/schema.ts";

const COLORS: Team["colors"] = ["#17181a", "#ffffff"];

const TEAMS: Team[] = [
  { id: "kamakura-lazaro", name: "鎌倉ラザロ", colors: COLORS, aliases: ["鎌倉"] },
  { id: "tokai-seagulls", name: "東海シーガルズ", colors: COLORS, aliases: ["東海"] },
];

// Each test numbers its own uploads, so that their order of publication is the order they
// were made in.
let nextId = 0;
beforeEach(() => {
  nextId = 0;
});

function upload(title: string, overrides: Partial<ChannelVideo> = {}): ChannelVideo {
  nextId += 1;
  return {
    videoId: `video-${String(nextId).padStart(5, "0")}`,
    title,
    publishedAt: `2026-10-06T03:00:${String(nextId % 60).padStart(2, "0")}Z`,
    durationSec: 1538,
    live: null,
    ...overrides,
  };
}

// The chance of a test is none: the first game drafted gets the ID "aaaaaaaa", the second
// "bbbbbbbb". An ID takes eight picks.
function inTurn(): (below: number) => number {
  let picks = 0;
  return (below) => Math.floor(picks++ / 8) % below;
}

function data(parts: Partial<SiteData> = {}): SiteData {
  return { teams: TEAMS, seasons: [], excluded: [], ...parts };
}

describe("draftGames", () => {
  it("makes a league game of a video whose title gives a date and two teams", () => {
    const video = upload("2026 10 4 鎌倉ラザロvs東海シーガルズ");

    expect(draftGames([video], data(), inTurn())).toEqual({
      games: [
        {
          id: "aaaaaaaa",
          date: "2026-10-04",
          season: "2026-2027",
          type: "league",
          teams: ["kamakura-lazaro", "tokai-seagulls"],
          needsReview: false,
          videos: [
            {
              videoId: video.videoId,
              part: 1,
              title: "2026 10 4 鎌倉ラザロvs東海シーガルズ",
              publishedAt: video.publishedAt,
              durationSec: 1538,
              live: null,
            },
          ],
        },
      ],
      unread: [],
    });
  });

  it("gives each new game an ID of its own, and none the data has", () => {
    const known = draftGames([upload("2026 10 4 鎌倉ラザロvs東海シーガルズ")], data(), inTurn());
    const uploads = [
      upload("2026 10 11 鎌倉ラザロvs東海シーガルズ"),
      upload("2026 10 18 鎌倉ラザロvs東海シーガルズ"),
    ];

    // The chance begins again at "aaaaaaaa", which the known game has.
    const { games } = draftGames(
      uploads,
      data({ seasons: [{ season: "2026-2027", games: known.games }] }),
      inTurn(),
    );

    expect(known.games.map((game) => game.id)).toEqual(["aaaaaaaa"]);
    expect(games.map((game) => [game.date, game.id])).toEqual([
      ["2026-10-11", "bbbbbbbb"],
      ["2026-10-18", "cccccccc"],
    ]);
  });

  it("puts a January game in the season that began the year before", () => {
    const { games } = draftGames(
      [upload("20220116 鎌倉ラザロ vs 東海シーガルズ")],
      data(),
      inTurn(),
    );

    expect(games.map((game) => game.season)).toEqual(["2021-2022"]);
  });

  it("takes the type from a keyword in the title", () => {
    const { games } = draftGames(
      [upload("2025/12/07 プレーオフ 鎌倉ラザロvs東海シーガルズ")],
      data(),
      inTurn(),
    );

    expect(games.map((game) => game.type)).toEqual(["playoff"]);
  });

  it("joins the videos of a split game in the order their titles name", () => {
    const second = upload("20211121 鎌倉vs東海 後半");
    const first = upload("20211121 鎌倉vs東海 前半");

    const { games } = draftGames([second, first], data(), inTurn());

    expect(games).toHaveLength(1);
    expect(games[0]?.videos.map((video) => [video.part, video.videoId])).toEqual([
      [1, first.videoId],
      [2, second.videoId],
    ]);
    expect(games[0]?.needsReview).toBe(false);
  });

  it("numbers two videos of one game that name no part, and asks for a review", () => {
    const earlier = upload("20231217-2 鎌倉vs東海", { publishedAt: "2023-12-17T05:00:00Z" });
    const later = upload("20231217-2 鎌倉vs東海", { publishedAt: "2023-12-17T09:00:00Z" });

    const { games } = draftGames([later, earlier], data(), inTurn());

    expect(games[0]?.videos.map((video) => [video.part, video.videoId])).toEqual([
      [1, earlier.videoId],
      [2, later.videoId],
    ]);
    expect(games[0]?.needsReview).toBe(true);
  });

  it("moves a video whose part is taken to the next free one, and asks for a review", () => {
    const firstQuarter = upload("20211114 1鎌倉vs東海前半1Q");
    const secondQuarter = upload("20211114 1鎌倉vs東海前半2Q");
    const secondHalf = upload("20211114 1鎌倉vs東海後半");

    const { games } = draftGames([firstQuarter, secondQuarter, secondHalf], data(), inTurn());

    expect(games[0]?.videos.map((video) => [video.part, video.videoId])).toEqual([
      [1, firstQuarter.videoId],
      [2, secondQuarter.videoId],
      [3, secondHalf.videoId],
    ]);
    expect(games[0]?.needsReview).toBe(true);
  });

  it("adds a new video to the game the data already has", () => {
    const known: Game = {
      id: "kkkkkkkk",
      date: "2021-11-21",
      season: "2021-2022",
      type: "playoff",
      teams: ["kamakura-lazaro", "tokai-seagulls"],
      needsReview: false,
      videos: [
        {
          videoId: "known-first",
          part: 1,
          title: "20211121 鎌倉vs東海 前半",
          publishedAt: "2021-11-25T03:00:00Z",
          durationSec: 800,
          live: null,
        },
      ],
    };
    const second = upload("20211121 鎌倉vs東海 後半");

    const { games } = draftGames(
      [second],
      data({ seasons: [{ season: "2021-2022", games: [known] }] }),
      inTurn(),
    );

    expect(games.map((game) => game.id)).toEqual(["kkkkkkkk"]);
    expect(games[0]?.type).toBe("playoff");
    expect(games[0]?.videos.map((video) => video.videoId)).toEqual(["known-first", second.videoId]);
  });

  it("adds another upload to the game a person moved to another date", () => {
    const corrected: Game = {
      id: "mmmmmmmm",
      date: "2022-12-04",
      season: "2022-2023",
      type: "league",
      teams: ["kamakura-lazaro", "tokai-seagulls"],
      needsReview: false,
      videos: [
        {
          videoId: "known-first",
          part: 1,
          title: "20221203-1 鎌倉vs東海",
          publishedAt: "2022-12-04T12:00:00Z",
          durationSec: 800,
          live: null,
        },
      ],
    };
    const again = upload("20221203-1 鎌倉vs東海");

    const { games } = draftGames(
      [again],
      data({ seasons: [{ season: "2022-2023", games: [corrected] }] }),
      inTurn(),
    );

    expect(games.map((game) => game.id)).toEqual(["mmmmmmmm"]);
    expect(games[0]?.videos.map((video) => video.videoId)).toEqual(["known-first", again.videoId]);
    expect(games[0]?.needsReview).toBe(true);
  });

  it("joins two uploads that name the teams in opposite orders, and asks for a review", () => {
    const first = upload("2026 10 4 鎌倉ラザロvs東海シーガルズ");
    const second = upload("2026 10 4 東海シーガルズvs鎌倉ラザロ");

    const { games } = draftGames([first, second], data(), inTurn());

    expect(games.map((game) => [game.id, game.teams])).toEqual([
      ["aaaaaaaa", ["kamakura-lazaro", "tokai-seagulls"]],
    ]);
    expect(games[0]?.videos.map((video) => video.videoId)).toEqual([first.videoId, second.videoId]);
    expect(games[0]?.needsReview).toBe(true);
  });

  it("leaves alone a video that is already in a game or on the exclusion list", () => {
    const inGame = upload("2026 10 4 鎌倉ラザロvs東海シーガルズ");
    const excluded = upload("2026/10/4 開会式");
    const known = draftGames([inGame], data(), inTurn()).games;

    const draft = draftGames(
      [inGame, excluded],
      data({
        seasons: [{ season: "2026-2027", games: known }],
        excluded: [{ videoId: excluded.videoId, title: excluded.title, reason: "a ceremony" }],
      }),
      inTurn(),
    );

    expect(draft).toEqual({ games: [], unread: [] });
  });

  it.each([
    ["2026/10/4 開会式", "no matchup in the title"],
    ["2025準決勝 鎌倉ラザロvs東海シーガルズ", "no game date in the title"],
    ["2026/10/4 鎌倉ラザロvs横浜タイタンズ", "no team is spelled 「横浜タイタンズ」"],
    ["2026/10/4 合同vs横浜タイタンズ", "no team is spelled 「合同」 or 「横浜タイタンズ」"],
  ])("leaves %s unread: %s", (title, reason) => {
    const video = upload(title);

    expect(draftGames([video], data(), inTurn())).toEqual({
      games: [],
      unread: [{ video, reason }],
    });
  });

  it("makes a game of a scheduled stream, with its state and without a length", () => {
    const live = { status: "upcoming", scheduledStartTime: "2026-12-20T04:00:00Z" } as const;
    const stream = upload("2026/12/20 プレーオフ 鎌倉ラザロvs東海シーガルズ", {
      durationSec: null,
      live,
    });

    const { games, unread } = draftGames([stream], data(), inTurn());

    expect(unread).toEqual([]);
    expect(games).toMatchObject([
      {
        date: "2026-12-20",
        type: "playoff",
        needsReview: false,
        videos: [{ videoId: stream.videoId, part: 1, durationSec: null, live }],
      },
    ]);
  });

  it("dates a stream whose title names no day by its scheduled start in Japan, and asks for a review", () => {
    // 00:30 on December 21 in Japan.
    const live = { status: "upcoming", scheduledStartTime: "2026-12-20T15:30:00Z" } as const;
    const stream = upload("ハーバーボウル 鎌倉ラザロvs東海シーガルズ", { durationSec: null, live });

    expect(draftGames([stream], data(), inTurn()).games).toMatchObject([
      { date: "2026-12-21", needsReview: true },
    ]);
  });

  it("dates a stream by its title where the title names a day", () => {
    const live = { status: "archived", scheduledStartTime: "2026-12-21T04:00:00Z" } as const;
    const stream = upload("2026/12/20 鎌倉ラザロvs東海シーガルズ", { live });

    expect(draftGames([stream], data(), inTurn()).games.map((game) => game.date)).toEqual([
      "2026-12-20",
    ]);
  });
});

describe("seasonFilesOf", () => {
  const known = (date: string, id = "kkkkkkkk"): Game => ({
    id,
    date,
    season: "2021-2022",
    type: "playoff",
    teams: ["kamakura-lazaro", "tokai-seagulls"],
    needsReview: false,
    videos: [
      {
        videoId: `k${date.replaceAll("-", "")}xx`,
        part: 1,
        title: `${date} 鎌倉vs東海`,
        publishedAt: "2021-11-25T03:00:00Z",
        durationSec: 800,
        live: null,
      },
    ],
  });

  it("keeps the games a file already has, as they are, beside the new one", () => {
    const earlier = known("2021-11-07", "eeeeeeee");
    const later = known("2021-12-19", "tttttttt");
    const site = data({ seasons: [{ season: "2021-2022", games: [earlier, later] }] });
    const { games } = draftGames([upload("20211121 鎌倉vs東海")], site, inTurn());

    const files = seasonFilesOf(site, games);

    expect([...files.keys()]).toEqual(["2021-2022"]);
    // The new game stands at its date, whatever ID it got.
    expect(files.get("2021-2022")?.map((game) => game.id)).toEqual([
      "eeeeeeee",
      "aaaaaaaa",
      "tttttttt",
    ]);
    expect(files.get("2021-2022")?.[0]).toEqual(earlier);
    expect(files.get("2021-2022")?.[2]).toEqual(later);
  });

  it("puts a game that gained a video in the place of its earlier version", () => {
    const first = known("2021-11-21");
    const site = data({ seasons: [{ season: "2021-2022", games: [first] }] });
    const { games } = draftGames([upload("20211121 鎌倉vs東海 後半")], site, inTurn());

    const written = seasonFilesOf(site, games).get("2021-2022");

    expect(written).toHaveLength(1);
    expect(written?.[0]?.videos.map((video) => video.part)).toEqual([1, 2]);
  });

  it("gives a season without a file a file, and leaves the other seasons unwritten", () => {
    const site = data({ seasons: [{ season: "2021-2022", games: [known("2021-11-07")] }] });
    const { games } = draftGames([upload("2026 10 4 鎌倉ラザロvs東海シーガルズ")], site, inTurn());

    expect([...seasonFilesOf(site, games).keys()]).toEqual(["2026-2027"]);
  });

  it("writes the keys of a new game in the order a file read back has them", () => {
    const { games } = draftGames(
      [upload("2026 10 4 鎌倉ラザロvs東海シーガルズ")],
      data(),
      inTurn(),
    );

    const written = seasonFilesOf(data(), games).get("2026-2027")?.[0] ?? {};

    expect(Object.keys(written)).toEqual([
      "id",
      "date",
      "season",
      "type",
      "teams",
      "needsReview",
      "videos",
    ]);
  });
});

describe("renderDraft", () => {
  it("lists each game with its videos, and each unread video with the reason", () => {
    const draft = draftGames(
      [
        upload("20211121 鎌倉vs東海 前半", { videoId: "aaaaaaaaaaa" }),
        upload("20211121 鎌倉vs東海 後半", { videoId: "bbbbbbbbbbb" }),
        upload("2026/10/4 開会式 ", { videoId: "ccccccccccc" }),
      ],
      data(),
      inTurn(),
    );

    expect(renderDraft(draft, TEAMS)).toBe(
      [
        "1 game gained a video, 1 video was left unread.",
        "",
        "| Date | Game | Type | Videos | Needs review |",
        "| --- | --- | --- | --- | --- |",
        "| 2021-11-21 | 鎌倉ラザロ vs 東海シーガルズ | league | 1: 20211121 鎌倉vs東海 前半<br>2: 20211121 鎌倉vs東海 後半 |  |",
        "",
        "Unread:",
        "",
        "- `ccccccccccc` 2026/10/4 開会式 (no matchup in the title)",
        "",
      ].join("\n"),
    );
  });

  it("says of a video that it is a stream, and where it stands", () => {
    const live = { status: "upcoming", scheduledStartTime: "2026-12-20T04:00:00Z" } as const;
    const draft = draftGames(
      [upload("2026/12/20 鎌倉ラザロvs東海シーガルズ", { durationSec: null, live })],
      data(),
      inTurn(),
    );

    expect(renderDraft(draft, TEAMS)).toContain(
      "| 1: 2026/12/20 鎌倉ラザロvs東海シーガルズ (live stream, upcoming, 2026-12-20T04:00:00Z) |",
    );
  });
});
