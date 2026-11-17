import { pathToFileURL } from "node:url";
import { buildCatalog } from "./catalog.ts";
import { loadData } from "./load-data.ts";
import { shareCardsOf } from "./share-cards.ts";

// The pages are built from the repository root, and a bundled module no longer sits next to
// data/, so the directory is found from the working directory, not from this file.
const DATA_DIR = pathToFileURL(`${process.cwd()}/data/`);

/** Everything under data/, read once per build. */
export const catalog = buildCatalog(await loadData(DATA_DIR));

/** The picture of a shared link of every page that has one, by the path of the page. */
export const shareCards = shareCardsOf(catalog);
