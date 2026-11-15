// Fetches the channel's videos, places the ones the data does not know yet into games by rule,
// writes the season files, and prints the draft for the pull request body. Every run looks at
// every upload; `make sync ARGS="--season=2021-2022"` writes that season's file only, which is
// how the first import was cut into one pull request per season.
import { writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { z } from "zod";
import { loadData } from "../src/lib/load-data.ts";
import { SeasonId } from "../src/lib/schema.ts";
import { SITE } from "../src/site.ts";
import { draftGames, renderDraft, seasonFilesOf } from "./draft-games.ts";
import { createYoutubeClient } from "./youtube.ts";

const DATA_DIR = new URL("../data/", import.meta.url);

const { values } = parseArgs({ options: { season: { type: "string", multiple: true } } });
// A mistyped season would otherwise match nothing and write nothing, without a word.
const onlySeasons =
  values.season === undefined ? null : new Set(z.array(SeasonId).parse(values.season));

const apiKey = process.env.YOUTUBE_API_KEY;
if (apiKey === undefined || apiKey === "") {
  throw new Error("YOUTUBE_API_KEY is not set (see .env.example)");
}

const youtube = createYoutubeClient({ apiKey });
const data = await loadData(DATA_DIR);
const videos = await youtube.getVideos(await youtube.listUploadIds(SITE.channelId));

const draft = draftGames(videos, data);
const written = draft.games.filter((game) => onlySeasons === null || onlySeasons.has(game.season));

for (const [season, games] of seasonFilesOf(data, written)) {
  await writeFile(new URL(`games/${season}.json`, DATA_DIR), `${JSON.stringify(games, null, 2)}\n`);
}

console.log(renderDraft({ games: written, unread: draft.unread }, data.teams));
