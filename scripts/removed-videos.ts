import type { Game, SiteData, Team, Video } from "../src/lib/schema.ts";
import { cell, count, matchupNames } from "./markdown.ts";
import { changedSeasonFiles, type SeasonFiles } from "./season-files.ts";

/** A game that loses videos, as it was, and the videos it loses. */
export type RemovedFromGame = {
  readonly game: Game;
  readonly videos: readonly Video[];
};

export type Removal = {
  readonly files: SeasonFiles;
  readonly removed: readonly RemovedFromGame[];
};

/** The videos the removal check asks YouTube for: every video of every game. */
export function gameVideoIds(data: SiteData): string[] {
  return data.seasons.flatMap((season) =>
    season.games.flatMap((game) => game.videos.map((video) => video.videoId)),
  );
}

/**
 * The data without the videos YouTube no longer returns, which were deleted or made private. A
 * game with no video left goes whole. The result is a draft for a pull request: a person
 * decides whether the videos are gone for good.
 *
 * A video that stays keeps its part number, so that a part that is uploaded again takes the
 * place of the one that went.
 *
 * An answer without a single one of the videos is refused: that is a fault of the key or of
 * the API, not the end of the channel, and a draft that removes every game helps nobody.
 *
 * @param present the IDs YouTube returned, of the ones `gameVideoIds` asked for
 */
export function removeVideos(data: SiteData, present: ReadonlySet<string>): Removal {
  const asked = gameVideoIds(data);
  if (asked.length > 0 && !asked.some((videoId) => present.has(videoId))) {
    throw new Error(`YouTube returned none of the ${asked.length} videos: nothing is removed`);
  }

  const removed: RemovedFromGame[] = [];
  const files = changedSeasonFiles(data, (game) => {
    const gone = game.videos.filter((video) => !present.has(video.videoId));
    if (gone.length === 0) return game;
    removed.push({ game, videos: gone });
    if (gone.length === game.videos.length) return null;
    return { ...game, videos: game.videos.filter((video) => present.has(video.videoId)) };
  });
  return { files, removed };
}

/** The removal as the Markdown a pull request body carries, for the person who checks it. */
export function renderRemoval(removal: Removal, teams: readonly Team[]): string {
  const { removed } = removal;
  if (removed.length === 0) return "Every video of every game is still on YouTube.\n";

  const videos = removed.reduce((sum, entry) => sum + entry.videos.length, 0);
  const whole = removed.filter(({ game, videos: gone }) => gone.length === game.videos.length);
  const lines = [
    `YouTube no longer returns ${count(videos, "video", "videos")} of ${count(removed.length, "game", "games")}: deleted, or made private.`,
    `${count(whole.length, "game loses", "games lose")} every video, and with it the game page.`,
    "",
    "| Date | Game | Removed | Left |",
    "| --- | --- | --- | --- |",
  ];
  for (const { game, videos: gone } of removed) {
    const listed = gone
      .map((video) => `${video.part}: ${cell(video.title)} (\`${video.videoId}\`)`)
      .join("<br>");
    const left = game.videos.length - gone.length;
    lines.push(
      `| ${game.date} | ${cell(matchupNames(game, teams))} | ${listed} | ${left === 0 ? "none, the game is removed" : count(left, "video", "videos")} |`,
    );
  }
  lines.push("");
  return lines.join("\n");
}
