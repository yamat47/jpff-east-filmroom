// Fetches the channel's videos, places the ones the data does not know yet into games by rule,
// writes the season files, and prints the draft for the pull request body. Every run looks at
// every upload; `make sync ARGS="--season=2021-2022"` writes that season's file only, which is
// how the first import was cut into one pull request per season.
import { parseArgs } from "node:util";
import { z } from "zod";
import { loadData } from "../src/lib/load-data.ts";
import { SeasonId } from "../src/lib/schema.ts";
import { SITE } from "../src/site.ts";
import { draftGames, renderDraft, seasonFilesOf } from "./draft-games.ts";
import { writeSeasonFiles } from "./season-files.ts";
import { createYoutubeClient, requireApiKey } from "./youtube.ts";

const DATA_DIR = new URL("../data/", import.meta.url);

const { values } = parseArgs({ options: { season: { type: "string", multiple: true } } });
// A mistyped season would otherwise match nothing and write nothing, without a word.
const onlySeasons =
  values.season === undefined ? null : new Set(z.array(SeasonId).parse(values.season));

const youtube = createYoutubeClient({ apiKey: requireApiKey(process.env) });
const data = await loadData(DATA_DIR);

// Details are asked only for the videos the data does not have yet.
const known = new Set(
  [
    ...data.seasons.flatMap((season) => season.games.flatMap((game) => game.videos)),
    ...data.excluded,
  ].map((video) => video.videoId),
);
const uploads = await youtube.listUploadIds(SITE.channelId);
const videos = await youtube.getVideos(uploads.filter((videoId) => !known.has(videoId)));

const draft = draftGames(videos, data);
const written = draft.games.filter((game) => onlySeasons === null || onlySeasons.has(game.season));

await writeSeasonFiles(DATA_DIR, seasonFilesOf(data, written));

console.log(renderDraft({ games: written, unread: draft.unread }, data.teams));
