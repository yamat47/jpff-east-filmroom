import { pathToFileURL } from "node:url";
import { buildCatalog } from "./catalog.ts";
import { loadData } from "./load-data.ts";

// The pages are built from the repository root, and a bundled module no longer sits next to
// data/, so the directory is found from the working directory, not from this file.
const DATA_DIR = pathToFileURL(`${process.cwd()}/data/`);

/** Everything under data/, read once per build. */
export const catalog = buildCatalog(await loadData(DATA_DIR));

/**
 * One path for each game. The game page and the picture of its shared link are both built
 * from this list, so that no page points at a picture that was not drawn.
 */
export function gamePaths() {
  return catalog.games.map((game) => ({ params: { id: game.id }, props: { game } }));
}
