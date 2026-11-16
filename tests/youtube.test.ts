import { describe, expect, it } from "vitest";
import { createYoutubeClient, requireApiKey, secondsOf } from "../scripts/youtube.ts";

type Call = { resource: string; params: Record<string, string> };

/** A stand-in for the API that answers from a table and records what it was asked. */
function fakeApi(answer: (call: Call) => unknown, status = 200) {
  const calls: Call[] = [];
  const fetch = async (input: string | URL | Request): Promise<Response> => {
    const url = new URL(String(input));
    const call = {
      resource: url.pathname.split("/").at(-1) ?? "",
      params: Object.fromEntries(url.searchParams),
    };
    calls.push(call);
    return new Response(JSON.stringify(answer(call)), { status });
  };
  return { fetch, calls };
}

const video = (id: string, overrides: Record<string, unknown> = {}) => ({
  id,
  snippet: {
    title: "2026 10 4 鎌倉ラザロvs東海シーガルズ",
    publishedAt: "2026-10-06T03:00:00Z",
    liveBroadcastContent: "none",
  },
  contentDetails: { duration: "PT25M38S" },
  ...overrides,
});

describe("listUploadIds", () => {
  it("follows the channel's uploads playlist through every page", async () => {
    const api = fakeApi(({ resource, params }) => {
      if (resource === "channels") {
        return { items: [{ contentDetails: { relatedPlaylists: { uploads: "UUchannel" } } }] };
      }
      return params.pageToken === undefined
        ? { nextPageToken: "second", items: [{ contentDetails: { videoId: "a" } }] }
        : { items: [{ contentDetails: { videoId: "b" } }] };
    });
    const youtube = createYoutubeClient({ apiKey: "key", fetch: api.fetch });

    expect(await youtube.listUploadIds("UCchannel")).toEqual(["a", "b"]);
    expect(
      api.calls.map(({ resource, params }) => [resource, params.playlistId, params.pageToken]),
    ).toEqual([
      ["channels", undefined, undefined],
      ["playlistItems", "UUchannel", undefined],
      ["playlistItems", "UUchannel", "second"],
    ]);
  });

  it("fails when the channel does not exist", async () => {
    const youtube = createYoutubeClient({
      apiKey: "key",
      fetch: fakeApi(() => ({ pageInfo: { totalResults: 0 } })).fetch,
    });

    await expect(youtube.listUploadIds("UCmissing")).rejects.toThrow("no channel UCmissing");
  });
});

describe("getVideos", () => {
  it("reads the title, the publication time and the length in seconds", async () => {
    const api = fakeApi(() => ({ items: [video("aaaaaaaaaaa")] }));
    const youtube = createYoutubeClient({ apiKey: "key", fetch: api.fetch });

    expect(await youtube.getVideos(["aaaaaaaaaaa"])).toEqual([
      {
        videoId: "aaaaaaaaaaa",
        title: "2026 10 4 鎌倉ラザロvs東海シーガルズ",
        publishedAt: "2026-10-06T03:00:00Z",
        durationSec: 1538,
        live: null,
      },
    ]);
  });

  it("asks for at most fifty videos in one call", async () => {
    const ids = Array.from({ length: 120 }, (_, index) => `video-${index}`);
    const api = fakeApi(({ params }) => ({
      items: (params.id ?? "").split(",").map((id) => video(id)),
    }));
    const youtube = createYoutubeClient({ apiKey: "key", fetch: api.fetch });

    const videos = await youtube.getVideos(ids);

    expect(videos.map((item) => item.videoId)).toEqual(ids);
    expect(api.calls.map(({ params }) => (params.id ?? "").split(",").length)).toEqual([
      50, 50, 20,
    ]);
  });

  it("leaves out a video the API does not return, as for one deleted or made private", async () => {
    const api = fakeApi(() => ({ items: [video("aaaaaaaaaaa")] }));
    const youtube = createYoutubeClient({ apiKey: "key", fetch: api.fetch });

    const videos = await youtube.getVideos(["aaaaaaaaaaa", "bbbbbbbbbbb"]);

    expect(videos.map((item) => item.videoId)).toEqual(["aaaaaaaaaaa"]);
  });

  const upcoming = { ...video("x").snippet, liveBroadcastContent: "upcoming" };
  const onAir = { ...video("x").snippet, liveBroadcastContent: "live" };
  const zero = { duration: "P0D" };
  const scheduledStartTime = "2026-12-20T04:00:00Z";
  const actualStartTime = "2026-12-20T04:03:10Z";

  it.each([
    [
      "a stream that is scheduled",
      { snippet: upcoming, contentDetails: zero, liveStreamingDetails: { scheduledStartTime } },
      { durationSec: null, live: { status: "upcoming", scheduledStartTime } },
    ],
    [
      "a stream that is on air",
      {
        snippet: onAir,
        contentDetails: zero,
        liveStreamingDetails: { scheduledStartTime, actualStartTime },
      },
      { durationSec: null, live: { status: "live", scheduledStartTime } },
    ],
    [
      "a stream that has ended",
      {
        contentDetails: { duration: "PT1H30M" },
        liveStreamingDetails: {
          scheduledStartTime,
          actualStartTime,
          actualEndTime: "2026-12-20T05:33:10Z",
        },
      },
      { durationSec: 5400, live: { status: "archived", scheduledStartTime } },
    ],
    [
      "a stream that has ended and has no length yet",
      { contentDetails: zero, liveStreamingDetails: { scheduledStartTime, actualStartTime } },
      { durationSec: null, live: { status: "archived", scheduledStartTime } },
    ],
    [
      "a stream that was started without a schedule, by the time it began at",
      { contentDetails: { duration: "PT1H30M" }, liveStreamingDetails: { actualStartTime } },
      { durationSec: 5400, live: { status: "archived", scheduledStartTime: actualStartTime } },
    ],
    [
      "a stream YouTube gives no start of, by the time it was published at",
      { contentDetails: { duration: "PT1H30M" }, liveStreamingDetails: {} },
      {
        durationSec: 5400,
        live: { status: "archived", scheduledStartTime: "2026-10-06T03:00:00Z" },
      },
    ],
  ])("reads %s", async (_case, overrides, expected) => {
    const api = fakeApi(() => ({ items: [video("aaaaaaaaaaa", overrides)] }));
    const youtube = createYoutubeClient({ apiKey: "key", fetch: api.fetch });

    expect((await youtube.getVideos(["aaaaaaaaaaa"]))[0]).toMatchObject(expected);
  });

  it("reports a refused call without the key or the response body", async () => {
    const api = fakeApi(() => ({ error: { message: "API key SECRET-KEY not valid" } }), 400);
    const youtube = createYoutubeClient({ apiKey: "SECRET-KEY", fetch: api.fetch });

    const error = await youtube.getVideos(["aaaaaaaaaaa"]).catch((caught: unknown) => caught);

    expect(error).toHaveProperty("message", "YouTube Data API: videos answered 400");
  });
});

describe("requireApiKey", () => {
  it("gives the key of the environment", () => {
    expect(requireApiKey({ YOUTUBE_API_KEY: "key" })).toBe("key");
  });

  it.each([{}, { YOUTUBE_API_KEY: "" }])("fails without one", (env) => {
    expect(() => requireApiKey(env)).toThrow("YOUTUBE_API_KEY is not set");
  });
});

describe("secondsOf", () => {
  it.each([
    ["PT29M57S", 1797],
    ["PT45S", 45],
    ["PT1H41M", 6060],
    ["PT2H", 7200],
    ["P1DT1S", 86401],
    ["P0D", 0],
  ])("reads %s as %i seconds", (duration, seconds) => {
    expect(secondsOf(duration)).toBe(seconds);
  });

  it("refuses a text that is not a duration", () => {
    expect(() => secondsOf("29:57")).toThrow("not an ISO 8601 duration");
  });
});
