// What a page knows of a live stream, and what it says of it at a given time. Nothing here
// reads a clock or a file: the time is an argument, so that tests fix the behaviour.
import type { LiveStatus } from "./game-types.ts";
import type { Game, Video } from "./schema.ts";

/** A live stream as the data has it. */
export type LiveStream = NonNullable<Video["live"]>;

/** A stream that has not ended, as far as the data knows. */
export type PendingStream = LiveStream & { readonly status: Exclude<LiveStatus, "archived"> };

/** What a page says of a stream that has not ended. */
export type LiveState = PendingStream["status"];

const HOUR_MS = 3_600_000;

// The data is as old as the last build. A stream whose end it has not heard of is taken to be
// over this long after its scheduled start.
const STREAM_MS = 4 * HOUR_MS;

// Japan keeps one offset from UTC all year.
const JAPAN_OFFSET_MS = 9 * HOUR_MS;

export function isPending(live: LiveStream): live is PendingStream {
  return live.status !== "archived";
}

/** The stream of a game that has not ended, or `null` for a game like any other. */
export function pendingStreamOf(game: Pick<Game, "videos">): PendingStream | null {
  for (const { live } of game.videos) {
    if (live !== null && isPending(live)) return live;
  }
  return null;
}

/**
 * What to say of a stream at a time: that it is scheduled, that it is on air, or nothing
 * (`null`), because it is over and its game is a game like any other.
 *
 * @param now milliseconds since the epoch, or `null` where there is no clock (the build, and a
 *   page without JavaScript), which leaves the state the data has
 */
export function liveStateAt(stream: PendingStream, now: number | null): LiveState | null {
  if (now === null) return stream.status;
  const start = Date.parse(stream.scheduledStartTime);
  if (now >= start + STREAM_MS) return null;
  return stream.status === "live" || now >= start ? "live" : "upcoming";
}

/**
 * Games cut in two by the clock: the streams that are scheduled or on air, the next to start
 * first, and the other games in the order they were given. A stream that is over is one of the
 * other games.
 */
export function splitByLive<T extends { readonly live: PendingStream | null }>(
  games: readonly T[],
  now: number | null,
): { live: T[]; others: T[] } {
  const live: (T & { readonly live: PendingStream })[] = [];
  const others: T[] = [];
  for (const game of games) {
    const stream = game.live;
    if (stream !== null && liveStateAt(stream, now) !== null) live.push({ ...game, live: stream });
    else others.push(game);
  }
  live.sort((a, b) => a.live.scheduledStartTime.localeCompare(b.live.scheduledStartTime));
  return { live, others };
}

/** The date in Japan at an instant, as YYYY-MM-DD. */
export function japanDateOf(instant: string): string {
  return inJapan(instant).slice(0, 10);
}

/** The time of day in Japan at an instant, as a schedule writes it: "13:00". */
export function japanTimeOf(instant: string): string {
  return inJapan(instant).slice(11, 16);
}

function inJapan(instant: string): string {
  const time = Date.parse(instant);
  if (Number.isNaN(time)) throw new TypeError(`not a date and time: ${instant}`);
  return new Date(time + JAPAN_OFFSET_MS).toISOString();
}
