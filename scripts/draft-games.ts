import { gameIdOf } from "../src/lib/game-id.ts";
import { type Game, Games, type SiteData, type Team, type Video } from "../src/lib/schema.ts";
import { seasonOf } from "../src/lib/season.ts";
import { parseTitle } from "./parse-title.ts";
import type { ChannelVideo } from "./youtube.ts";

/** A video the rules could not place in a game, and why. A person places it by hand. */
export type UnreadVideo = { readonly video: ChannelVideo; readonly reason: string };

export type Draft = {
  /** Every game that gained a video, whole: new games, and known ones with their new videos. */
  readonly games: readonly Game[];
  readonly unread: readonly UnreadVideo[];
};

/**
 * Places the channel's videos that the data does not know yet into games, by the rules alone.
 * The result is a draft: it reaches the site only through a pull request a person has checked.
 */
export function draftGames(videos: readonly ChannelVideo[], data: SiteData): Draft {
  const knownGames = data.seasons.flatMap((season) => season.games);
  const knownVideoIds = new Set([
    ...knownGames.flatMap((game) => game.videos.map((video) => video.videoId)),
    ...data.excluded.map((video) => video.videoId),
  ]);

  const games = new Map(knownGames.map((game) => [game.id, game]));
  const gained = new Map<string, { game: Game; videos: NewVideo[] }>();
  const unread: UnreadVideo[] = [];

  const oldestFirst = [...videos].sort((a, b) => a.publishedAt.localeCompare(b.publishedAt));
  for (const video of oldestFirst) {
    if (knownVideoIds.has(video.videoId)) continue;

    const placed = placeVideo(video, data.teams);
    if ("reason" in placed) {
      unread.push({ video, reason: placed.reason });
      continue;
    }
    // A game the data already has keeps what a person decided about it: its type, its flag.
    const entry = gained.get(placed.game.id) ?? {
      game: games.get(placed.game.id) ?? placed.game,
      videos: [],
    };
    entry.videos.push({ video, part: placed.part });
    gained.set(placed.game.id, entry);
  }

  const drafted = [...gained.values()].map(({ game, videos }) => withVideos(game, videos));
  return { games: drafted.sort((a, b) => a.id.localeCompare(b.id)), unread };
}

type NewVideo = { readonly video: ChannelVideo; readonly part: number | null };

function placeVideo(
  video: ChannelVideo,
  registered: readonly Team[],
): { game: Game; part: number | null } | { reason: string } {
  if (video.isLiveStream) return { reason: "a live stream, which the import does not handle yet" };

  const parsed = parseTitle(video.title, registered);
  if (parsed.sides === null) return { reason: "no matchup in the title" };

  const [first, second] = parsed.sides;
  if (first.teamId === null || second.teamId === null) {
    const unknown = parsed.sides.filter((side) => side.teamId === null);
    return {
      reason: `no team is spelled ${unknown.map((side) => `「${side.spelling}」`).join(" or ")}`,
    };
  }
  if (parsed.date === null) return { reason: "no game date in the title" };

  const date = parsed.date;
  const teams: [string, string] = [first.teamId, second.teamId];
  return {
    // The keys in the order of the schema, which is the order a season file keeps them in.
    game: {
      id: gameIdOf({ date, teams }),
      date,
      season: seasonOf(date),
      // Without a keyword in the title the rules have no evidence, and most games are league
      // games. The game is not marked for review on that ground alone: nearly every game would
      // be, and the mark would no longer single out the ones with something to decide.
      type: parsed.type ?? "league",
      teams,
      needsReview: false,
      videos: [],
    },
    part: parsed.part,
  };
}

/**
 * The game with the new videos added. A video keeps the part its title names. One whose title
 * names none, or names a part that is taken, gets the next free number, and the game is marked
 * for review unless that video is the only one: two unmarked videos of one game are a split the
 * titles do not explain, or the same game uploaded twice.
 */
function withVideos(game: Game, added: readonly NewVideo[]): Game {
  const videos: Video[] = [...game.videos];
  let needsReview = game.needsReview;

  const marked = added.filter((entry) => entry.part !== null);
  const unmarked = added.filter((entry) => entry.part === null);
  for (const { video, part } of [...marked, ...unmarked]) {
    const taken = new Set(videos.map((existing) => existing.part));
    const free = part !== null && !taken.has(part);
    if (!free && videos.length > 0) needsReview = true;

    videos.push({
      videoId: video.videoId,
      part: free ? part : nextFree(taken),
      title: video.title,
      publishedAt: video.publishedAt,
      durationSec: video.durationSec,
      live: null,
    });
  }
  return { ...game, needsReview, videos: videos.sort((a, b) => a.part - b.part) };
}

function nextFree(taken: ReadonlySet<number>): number {
  let part = 1;
  while (taken.has(part)) part++;
  return part;
}

/**
 * The whole content of every season file the drafted games belong to: the games the file has,
 * with the drafted ones added or put in the place of their earlier version. A file no drafted
 * game belongs to is not in the result, so it is not rewritten.
 */
export function seasonFilesOf(data: SiteData, drafted: readonly Game[]): Map<string, Game[]> {
  const files = new Map<string, Game[]>();
  for (const season of new Set(drafted.map((game) => game.season))) {
    const known = data.seasons.find((file) => file.season === season)?.games ?? [];
    const games = new Map(
      [...known, ...drafted.filter((game) => game.season === season)].map((game) => [
        game.id,
        game,
      ]),
    );
    // Through the schema, so that the keys are written in its order whatever built the game, and
    // a file `make validate` would refuse is not written at all.
    files.set(season, Games.parse([...games.values()].sort((a, b) => a.id.localeCompare(b.id))));
  }
  return files;
}

/** The draft as the Markdown a pull request body carries, for the person who checks it. */
export function renderDraft(draft: Draft, teams: readonly Team[]): string {
  const nameOf = new Map(teams.map((team) => [team.id, team.name]));
  const cell = (text: string) => text.replaceAll("|", "\\|");

  const games = draft.games.length === 1 ? "1 game" : `${draft.games.length} games`;
  const videos = draft.unread.length === 1 ? "1 video was" : `${draft.unread.length} videos were`;
  const lines = [`${games} gained a video, ${videos} left unread.`, ""];
  if (draft.games.length > 0) {
    lines.push("| Date | Game | Type | Videos | Needs review |", "| --- | --- | --- | --- | --- |");
    for (const game of draft.games) {
      const matchup = game.teams.map((id) => nameOf.get(id) ?? id).join(" vs ");
      const videos = game.videos.map((video) => `${video.part}: ${cell(video.title)}`).join("<br>");
      lines.push(
        `| ${game.date} | ${cell(matchup)} | ${game.type} | ${videos} | ${game.needsReview ? "yes" : ""} |`,
      );
    }
    lines.push("");
  }
  if (draft.unread.length > 0) {
    lines.push("Unread:", "");
    for (const { video, reason } of draft.unread) {
      lines.push(`- \`${video.videoId}\` ${video.title.trim()} (${reason})`);
    }
    lines.push("");
  }
  return lines.join("\n");
}
