// Brings the live streams of the data up to what YouTube reports now: scheduled, on air or
// ended, the scheduled start, and the length once the stream is over. It asks only for the
// streams the data does not have the end of, so most runs ask for nothing.
import { loadData } from "../src/lib/load-data.ts";
import { followedVideoIds, refreshLive, renderLiveRefresh } from "./live-state.ts";
import { writeSeasonFiles } from "./season-files.ts";
import { createYoutubeClient, requireApiKey } from "./youtube.ts";

const DATA_DIR = new URL("../data/", import.meta.url);

// Asked for even when no stream is followed, so that a missing key shows on the first run and
// not on the day of a stream.
const youtube = createYoutubeClient({ apiKey: requireApiKey(process.env) });
const data = await loadData(DATA_DIR);

const followed = followedVideoIds(data);
const refresh = refreshLive(data, await youtube.getVideos(followed));
await writeSeasonFiles(DATA_DIR, refresh.files);

console.log(`${followed.length} followed.`);
console.log(renderLiveRefresh(refresh, data.teams));
