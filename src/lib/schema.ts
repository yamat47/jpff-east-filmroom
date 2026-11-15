import { z } from "zod";
import { GAME_TYPES, LIVE_STATUSES } from "./game-types.ts";

export { GAME_TYPES, type GameType, LIVE_STATUSES, type LiveStatus } from "./game-types.ts";

// A team ID is part of a URL (/teams/{id}/) and of every game ID.
const TeamId = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "lower-case letters, digits and hyphens");

export const SeasonId = z
  .string()
  .regex(/^\d{4}-\d{4}$/, "two years, as in 2026-2027")
  .refine(
    (id) => Number(id.slice(5)) === Number(id.slice(0, 4)) + 1,
    "the second year follows the first",
  );

const VideoId = z.string().regex(/^[A-Za-z0-9_-]{11}$/, "a YouTube video ID");

export const Team = z.strictObject({
  id: TeamId,
  name: z.string().trim().min(1),
  aliases: z.array(z.string().trim().min(1)).default([]),
});
export type Team = z.infer<typeof Team>;

export const Teams = z.array(Team);

const Live = z.strictObject({
  status: z.enum(LIVE_STATUSES),
  scheduledStartTime: z.iso.datetime(),
});

export const Video = z.strictObject({
  videoId: VideoId,
  part: z.int().positive(),
  title: z.string().min(1),
  publishedAt: z.iso.datetime(),
  // Unknown until a live stream has ended.
  durationSec: z.int().nonnegative().nullable(),
  live: Live.nullable(),
});
export type Video = z.infer<typeof Video>;

export const Game = z.strictObject({
  id: z.string().min(1),
  date: z.iso.date(),
  season: SeasonId,
  type: z.enum(GAME_TYPES),
  teams: z.tuple([TeamId, TeamId]),
  needsReview: z.boolean(),
  videos: z.array(Video).min(1),
});
export type Game = z.infer<typeof Game>;

export const Games = z.array(Game);

export const ExcludedVideo = z.strictObject({
  videoId: VideoId,
  title: z.string().min(1),
  reason: z.string().min(1),
});
export type ExcludedVideo = z.infer<typeof ExcludedVideo>;

export const ExcludedVideos = z.array(ExcludedVideo);

/** Everything under data/, already parsed. `season` is the one in the file name. */
export type SiteData = {
  readonly teams: readonly Team[];
  readonly seasons: readonly { readonly season: string; readonly games: readonly Game[] }[];
  readonly excluded: readonly ExcludedVideo[];
};
