import { describe, expect, it } from "vitest";
import { followedVideoIds, refreshLive, renderLiveRefresh } from "../scripts/live-state.ts";
import type { ChannelVideo } from "../scripts/youtube.ts";
import type { Game, SiteData, Team, Video } from "../src/lib/schema.ts";

const COLORS: Team["colors"] = ["#17181a", "#ffffff"];
const TEAMS: Team[] = [
  { id: "kamakura-lazaro", name: "鎌倉ラザロ", colors: COLORS, aliases: [] },
  { id: "tokai-seagulls", name: "東海シーガルズ", colors: COLORS, aliases: [] },
];

// 13:00 in Japan on December 20.
const START = "2026-12-20T04:00:00Z";

const video = (videoId: string, change: Partial<Video> = {}): Video => ({
  videoId,
  part: 1,
  title: "2026/12/20 ハーバーボウル 鎌倉ラザロvs東海シーガルズ",
  publishedAt: "2026-12-13T03:00:00Z",
  durationSec: 1538,
  live: null,
  ...change,
});

// An ID that names the video of its game, for the reading of a test. A real one says nothing of the game.
const game = (id: string, videos: Video[]): Game => ({
  id: `2026-12-20-${id}`,
  date: "2026-12-20",
  season: "2026-2027",
  type: "playoff",
  teams: ["kamakura-lazaro", "tokai-seagulls"],
  needsReview: false,
  videos,
});

const SCHEDULED = video("scheduled00", {
  durationSec: null,
  live: { status: "upcoming", scheduledStartTime: START },
});
const UNPROCESSED = video("unprocessed", {
  durationSec: null,
  live: { status: "archived", scheduledStartTime: START },
});
const ENDED = video("ended000000", {
  durationSec: 5400,
  live: { status: "archived", scheduledStartTime: START },
});
const UPLOAD = video("upload00000");

const data = (...videos: Video[]): SiteData => ({
  teams: [],
  seasons: [{ season: "2026-2027", games: videos.map((item) => game(item.videoId, [item])) }],
  excluded: [],
});

const fetched = (from: Video, change: Partial<ChannelVideo>): ChannelVideo => ({
  videoId: from.videoId,
  title: "a title that was changed on YouTube",
  publishedAt: from.publishedAt,
  durationSec: from.durationSec,
  live: from.live,
  ...change,
});

describe("followedVideoIds", () => {
  it("follows a stream until the data has both its end and its length", () => {
    expect(followedVideoIds(data(SCHEDULED, UNPROCESSED, ENDED, UPLOAD))).toEqual([
      "scheduled00",
      "unprocessed",
    ]);
  });
});

describe("refreshLive", () => {
  it("takes the state and the length of a stream that has ended, and nothing else", () => {
    const now = fetched(SCHEDULED, {
      durationSec: 5400,
      live: { status: "archived", scheduledStartTime: START },
    });

    const { files, changes } = refreshLive(data(SCHEDULED, UPLOAD), [now]);

    expect([...files.keys()]).toEqual(["2026-2027"]);
    expect(files.get("2026-2027")).toEqual([
      game("scheduled00", [{ ...SCHEDULED, durationSec: 5400, live: now.live }]),
      game("upload00000", [UPLOAD]),
    ]);
    expect(changes).toEqual([
      {
        game: game("scheduled00", [SCHEDULED]),
        videoId: "scheduled00",
        before: { durationSec: null, live: SCHEDULED.live },
        after: { durationSec: 5400, live: now.live },
      },
    ]);
  });

  it("follows a start that was put off within the day", () => {
    const later = { status: "upcoming", scheduledStartTime: "2026-12-20T06:00:00Z" } as const;

    const { files, offDay } = refreshLive(data(SCHEDULED), [fetched(SCHEDULED, { live: later })]);

    expect(files.get("2026-2027")?.[0]?.videos[0]?.live).toEqual(later);
    expect(offDay).toEqual([]);
  });

  it("names a stream that was put off to another day, and leaves the game date", () => {
    const nextDay = { status: "upcoming", scheduledStartTime: "2026-12-21T04:00:00Z" } as const;
    const note = { game: { date: "2026-12-20" }, videoId: "scheduled00", day: "2026-12-21" };

    const first = refreshLive(data(SCHEDULED), [fetched(SCHEDULED, { live: nextDay })]);

    expect(first.files.get("2026-2027")?.[0]?.date).toBe("2026-12-20");
    expect(first.offDay).toMatchObject([note]);

    // The note is of the data, so the next run still has it though nothing changes any more.
    const putOff = { ...SCHEDULED, live: nextDay };
    const second = refreshLive(data(putOff), [fetched(putOff, {})]);

    expect(second.changes).toEqual([]);
    expect(second.offDay).toMatchObject([note]);
  });

  it("has no note for a stream that has ended, whatever day it ran on", () => {
    const ended = {
      ...ENDED,
      live: { status: "archived", scheduledStartTime: "2026-12-21T04:00:00Z" },
    } as const;

    expect(refreshLive(data(ended), []).offDay).toEqual([]);
  });

  it("writes nothing while YouTube reports what the data has", () => {
    expect(refreshLive(data(SCHEDULED), [fetched(SCHEDULED, {})])).toEqual({
      files: new Map(),
      changes: [],
      offDay: [],
    });
  });

  it("leaves a stream YouTube does not return, which is for the removal check", () => {
    expect(refreshLive(data(SCHEDULED), []).files.size).toBe(0);
  });

  it("does not touch a video it does not follow, whatever YouTube reports of it", () => {
    const answers = [
      fetched(ENDED, { durationSec: 5401 }),
      fetched(UPLOAD, { live: { status: "live", scheduledStartTime: START } }),
    ];

    expect(refreshLive(data(ENDED, UPLOAD), answers).files.size).toBe(0);
  });
});

describe("renderLiveRefresh", () => {
  it("says that nothing changed", () => {
    expect(renderLiveRefresh({ changes: [], offDay: [] }, TEAMS)).toBe("No stream has changed.\n");
  });

  it("writes one line per stream that changed, then the streams on another day than their game", () => {
    const refresh = refreshLive(data(SCHEDULED, UNPROCESSED), [
      fetched(SCHEDULED, { live: { status: "live", scheduledStartTime: "2026-12-21T04:00:00Z" } }),
      fetched(UNPROCESSED, { durationSec: 5400 }),
    ]);

    expect(renderLiveRefresh(refresh, TEAMS)).toBe(
      [
        "- 2026-12-20 鎌倉ラザロ vs 東海シーガルズ (scheduled00): upcoming, 2026-12-20T04:00:00Z, no length yet -> live, 2026-12-21T04:00:00Z, no length yet",
        "- 2026-12-20 鎌倉ラザロ vs 東海シーガルズ (unprocessed): archived, 2026-12-20T04:00:00Z, no length yet -> archived, 2026-12-20T04:00:00Z, 5400s",
        "",
        "Scheduled for another day in Japan than the date of the game, which a person corrects:",
        "",
        "- 2026-12-20 鎌倉ラザロ vs 東海シーガルズ (scheduled00): 2026-12-21",
        "",
      ].join("\n"),
    );
  });
});
