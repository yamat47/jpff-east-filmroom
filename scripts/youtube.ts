import { z } from "zod";
import type { LiveStream } from "../src/lib/live.ts";

const API = "https://www.googleapis.com/youtube/v3/";

// The largest page and the largest number of IDs one call takes.
const PAGE_SIZE = 50;

// A call that has not answered by then is given up, so that a stalled connection fails the
// import instead of hanging it.
const TIMEOUT_MS = 30_000;

// The parts of the responses the import reads, named as in the API reference:
// https://developers.google.com/youtube/v3/docs/channels#resource
// https://developers.google.com/youtube/v3/docs/playlistItems#resource
// https://developers.google.com/youtube/v3/docs/videos#resource
const ChannelsResponse = z.object({
  // Left out of the response, not empty, when no channel has the ID.
  items: z
    .array(
      z.object({
        contentDetails: z.object({ relatedPlaylists: z.object({ uploads: z.string() }) }),
      }),
    )
    .default([]),
});

const PlaylistItemsResponse = z.object({
  nextPageToken: z.string().optional(),
  items: z.array(z.object({ contentDetails: z.object({ videoId: z.string() }) })),
});

const VideosResponse = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      snippet: z.object({
        title: z.string(),
        publishedAt: z.iso.datetime(),
        liveBroadcastContent: z.enum(["none", "upcoming", "live"]),
      }),
      contentDetails: z.object({ duration: z.string() }),
      // Present only for a video that is or was a live stream. A stream that was started
      // without a schedule has no scheduled start.
      liveStreamingDetails: z
        .object({
          scheduledStartTime: z.iso.datetime().optional(),
          actualStartTime: z.iso.datetime().optional(),
        })
        .optional(),
    }),
  ),
});

/** A video of the channel, reduced to what the import stores or decides on. */
export type ChannelVideo = {
  readonly videoId: string;
  readonly title: string;
  readonly publishedAt: string;
  /** `null` for a live stream whose length YouTube does not give yet. */
  readonly durationSec: number | null;
  /** The state of a video that is, or once was, a live stream; `null` for any other video. */
  readonly live: LiveStream | null;
};

export type YoutubeClient = {
  /** The IDs of every video the channel has uploaded, newest first. */
  listUploadIds(channelId: string): Promise<string[]>;
  /** The videos with these IDs. One that was deleted or made private is left out. */
  getVideos(videoIds: readonly string[]): Promise<ChannelVideo[]>;
};

/** The API key of the environment. The scripts that ask YouTube fail at once without it. */
export function requireApiKey(env: Record<string, string | undefined>): string {
  const apiKey = env.YOUTUBE_API_KEY;
  if (apiKey === undefined || apiKey === "") {
    throw new Error("YOUTUBE_API_KEY is not set (see .env.example)");
  }
  return apiKey;
}

export function createYoutubeClient(options: {
  apiKey: string;
  fetch?: typeof fetch;
}): YoutubeClient {
  const request = options.fetch ?? fetch;

  async function get<Schema extends z.ZodType>(
    schema: Schema,
    resource: string,
    params: Record<string, string>,
  ): Promise<z.output<Schema>> {
    const url = new URL(resource, API);
    url.search = new URLSearchParams({ ...params, key: options.apiKey }).toString();

    const response = await request(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    // The URL carries the key, so neither it nor the response body, which can quote it, goes
    // into the message.
    if (!response.ok) throw new Error(`YouTube Data API: ${resource} answered ${response.status}`);
    return schema.parse(await response.json());
  }

  return {
    async listUploadIds(channelId) {
      const channels = await get(ChannelsResponse, "channels", {
        part: "contentDetails",
        id: channelId,
      });
      const playlistId = channels.items[0]?.contentDetails.relatedPlaylists.uploads;
      if (playlistId === undefined) throw new Error(`YouTube Data API: no channel ${channelId}`);

      const videoIds: string[] = [];
      let pageToken: string | undefined;
      do {
        const page = await get(PlaylistItemsResponse, "playlistItems", {
          part: "contentDetails",
          playlistId,
          maxResults: String(PAGE_SIZE),
          ...(pageToken === undefined ? {} : { pageToken }),
        });
        videoIds.push(...page.items.map((item) => item.contentDetails.videoId));
        pageToken = page.nextPageToken;
      } while (pageToken !== undefined);
      return videoIds;
    },

    async getVideos(videoIds) {
      const videos: ChannelVideo[] = [];
      for (let start = 0; start < videoIds.length; start += PAGE_SIZE) {
        const page = await get(VideosResponse, "videos", {
          part: "snippet,contentDetails,liveStreamingDetails",
          id: videoIds.slice(start, start + PAGE_SIZE).join(","),
        });
        videos.push(
          ...page.items.map((item) => {
            const live = liveOf(item);
            const seconds = secondsOf(item.contentDetails.duration);
            return {
              videoId: item.id,
              title: item.snippet.title,
              publishedAt: item.snippet.publishedAt,
              // A stream has a length of zero until it has ended and YouTube has processed it.
              durationSec: live !== null && seconds === 0 ? null : seconds,
              live,
            };
          }),
        );
      }
      return videos;
    },
  };
}

type VideoResource = z.output<typeof VideosResponse>["items"][number];

function liveOf({ snippet, liveStreamingDetails }: VideoResource): LiveStream | null {
  // An ended stream reads "none" like any upload, and only the details say what it was.
  if (liveStreamingDetails === undefined && snippet.liveBroadcastContent === "none") return null;
  return {
    status: snippet.liveBroadcastContent === "none" ? "archived" : snippet.liveBroadcastContent,
    // The data keeps one time for a stream. One that was started without a schedule has only
    // the time it began at.
    scheduledStartTime:
      liveStreamingDetails?.scheduledStartTime ??
      liveStreamingDetails?.actualStartTime ??
      snippet.publishedAt,
  };
}

const ISO_DURATION = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/;

/** The length of a video in seconds, from the ISO 8601 duration the API gives ("PT29M57S"). */
export function secondsOf(duration: string): number {
  const match = ISO_DURATION.exec(duration);
  if (match === null) throw new Error(`not an ISO 8601 duration: ${duration}`);
  const [days, hours, minutes, seconds] = match.slice(1).map((value) => Number(value ?? 0));
  return (((days ?? 0) * 24 + (hours ?? 0)) * 60 + (minutes ?? 0)) * 60 + (seconds ?? 0);
}
