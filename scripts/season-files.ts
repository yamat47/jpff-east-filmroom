import { writeFile } from "node:fs/promises";
import { type Game, Games, type SiteData } from "../src/lib/schema.ts";

/** The whole content of every season file that changes, by season. */
export type SeasonFiles = ReadonlyMap<string, readonly Game[]>;

/**
 * The season files a change touches. `change` gives a game back as it is to leave it, another
 * game to put in its place, or `null` to take it out. A file none of whose games changes is not
 * in the result, so it is not rewritten.
 */
export function changedSeasonFiles(
  data: SiteData,
  change: (game: Game) => Game | null,
): SeasonFiles {
  const files = new Map<string, Game[]>();
  for (const { season, games } of data.seasons) {
    const changed = games.map(change);
    if (changed.some((game, index) => game !== games[index])) {
      files.set(
        season,
        changed.filter((game) => game !== null),
      );
    }
  }
  return files;
}

/**
 * Writes each season file whole, in the form `make validate` and a pull request diff read.
 * Every script that writes one passes through here, so this is where the schema has its say:
 * a file that does not fit it is not written, whatever built its games.
 */
export async function writeSeasonFiles(dataDir: URL, files: SeasonFiles): Promise<void> {
  for (const [season, games] of files) {
    await writeFile(
      new URL(`games/${season}.json`, dataDir),
      `${JSON.stringify(Games.parse(games), null, 2)}\n`,
    );
  }
}
