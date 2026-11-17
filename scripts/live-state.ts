import { isPending, japanDateOf } from "../src/lib/live.ts";
import type { Game, SiteData, Team, Video } from "../src/lib/schema.ts";
import { matchupNames } from "./markdown.ts";
import { changedSeasonFiles, type SeasonFiles } from "./season-files.ts";
import type { ChannelVideo } from "./youtube.ts";

/** What YouTube alone decides about a stream: where it stands, when it starts, how long it was. */
type StreamValues = Pick<Video, "durationSec" | "live">;

export type LiveChange = {
  /** The game as it was. The report names it by its date and teams: its ID says nothing of it. */
  readonly game: Game;
  readonly videoId: string;
  readonly before: StreamValues;
  readonly after: StreamValues;
};

/**
 * A stream that is scheduled for another day, in Japan, than the date of its game. The date of
 * a game is not YouTube's to decide, so the refresh leaves it and a person corrects the game.
 */
export type OffDayStream = {
  readonly game: Game;
  readonly videoId: string;
  readonly day: string;
};

export type LiveRefresh = {
  readonly files: SeasonFiles;
  readonly changes: readonly LiveChange[];
  /** Every such stream of the refreshed data, not only the ones this run changed. */
  readonly offDay: readonly OffDayStream[];
};

// A stream is followed until the data has both its end and its length. YouTube gives the
// length some time after the end.
function isFollowed({ live, durationSec }: StreamValues): boolean {
  return live !== null && (isPending(live) || durationSec === null);
}

/** The videos the refresh asks YouTube for: the streams the data does not have the end of. */
export function followedVideoIds(data: SiteData): string[] {
  return data.seasons.flatMap((season) =>
    season.games.flatMap((game) => game.videos.filter(isFollowed).map((video) => video.videoId)),
  );
}

/**
 * The data with the state, the scheduled start and the length of its streams as YouTube
 * reports them now. These are the only values that reach the site without a person's check
 * (requirements, section 6), so nothing else of a game or a video is touched: not its date,
 * not its title.
 *
 * A stream YouTube does not return is left as it is: the removal check drafts its removal.
 */
export function refreshLive(data: SiteData, fetched: readonly ChannelVideo[]): LiveRefresh {
  const fetchedOf = new Map(fetched.map((video) => [video.videoId, video]));
  const changes: LiveChange[] = [];
  const offDay: OffDayStream[] = [];

  const files = changedSeasonFiles(data, (game) => {
    const before = changes.length;
    const videos = game.videos.map((video) => {
      const now = fetchedOf.get(video.videoId);
      // YouTube calls a video a stream for good, so one it reports as an ordinary upload is
      // not the video the data has.
      if (!isFollowed(video) || now === undefined || now.live === null) return video;

      const after: StreamValues = { durationSec: now.durationSec, live: now.live };
      if (sameValues(video, after)) return video;

      changes.push({
        game,
        videoId: video.videoId,
        before: { durationSec: video.durationSec, live: video.live },
        after,
      });
      return { ...video, ...after };
    });

    for (const { videoId, live } of videos) {
      if (live === null || !isPending(live)) continue;
      const day = japanDateOf(live.scheduledStartTime);
      if (day !== game.date) offDay.push({ game, videoId, day });
    }
    return changes.length === before ? game : { ...game, videos };
  });
  return { files, changes, offDay };
}

function sameValues(a: StreamValues, b: StreamValues): boolean {
  return (
    a.durationSec === b.durationSec &&
    a.live?.status === b.live?.status &&
    a.live?.scheduledStartTime === b.live?.scheduledStartTime
  );
}

/** What a refresh did and found, as lines of text for the log and for a commit message. */
export function renderLiveRefresh(
  { changes, offDay }: Pick<LiveRefresh, "changes" | "offDay">,
  teams: readonly Team[],
): string {
  const told = ({ live, durationSec }: StreamValues) =>
    live === null
      ? "not a stream"
      : `${live.status}, ${live.scheduledStartTime}, ${durationSec === null ? "no length yet" : `${durationSec}s`}`;

  const name = (game: Game) => `${game.date} ${matchupNames(game, teams)}`;

  const lines =
    changes.length === 0
      ? ["No stream has changed."]
      : changes.map(
          (change) =>
            `- ${name(change.game)} (${change.videoId}): ${told(change.before)} -> ${told(change.after)}`,
        );
  if (offDay.length > 0) {
    lines.push(
      "",
      "Scheduled for another day in Japan than the date of the game, which a person corrects:",
      "",
      ...offDay.map((stream) => `- ${name(stream.game)} (${stream.videoId}): ${stream.day}`),
    );
  }
  return `${lines.join("\n")}\n`;
}
