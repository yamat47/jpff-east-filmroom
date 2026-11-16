// The removal check: asks YouTube for every video of every game, takes the ones it no longer
// returns out of the season files, and prints the removal for the pull request body. A video
// that was deleted and one that was made private look the same from here: neither is returned.
import { loadData } from "../src/lib/load-data.ts";
import { gameVideoIds, removeVideos, renderRemoval } from "./removed-videos.ts";
import { writeSeasonFiles } from "./season-files.ts";
import { createYoutubeClient, requireApiKey } from "./youtube.ts";

const DATA_DIR = new URL("../data/", import.meta.url);

const youtube = createYoutubeClient({ apiKey: requireApiKey(process.env) });
const data = await loadData(DATA_DIR);

const present = (await youtube.getVideos(gameVideoIds(data))).map((video) => video.videoId);
const removal = removeVideos(data, new Set(present));
await writeSeasonFiles(DATA_DIR, removal.files);

console.log(renderRemoval(removal, data.teams));
