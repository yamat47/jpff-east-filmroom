import { readdir, readFile } from "node:fs/promises";
import { parse as parseYaml } from "yaml";
import { z } from "zod";
import { ExcludedVideos, Games, type SiteData, Teams } from "./schema.ts";

/** A file under data/ that cannot be read as what it should hold. */
export class DataFileError extends Error {
  override readonly name = "DataFileError";
}

const SEASON_FILE = /^(\d{4}-\d{4})\.json$/;

/** Reads everything under the data directory and checks each file against its schema. */
export async function loadData(dataDir: URL): Promise<SiteData> {
  const gamesDir = new URL("games/", dataDir);
  const seasonFiles = (await readdir(gamesDir)).filter((name) => name.endsWith(".json")).sort();

  const seasons = await Promise.all(
    seasonFiles.map(async (name) => {
      const season = SEASON_FILE.exec(name)?.[1];
      if (season === undefined) {
        throw new DataFileError(
          `games/${name}: a game file is named after its season, as in 2026-2027.json`,
        );
      }
      return { season, games: await readFileAs(Games, new URL(name, gamesDir), JSON.parse) };
    }),
  );

  return {
    teams: await readFileAs(Teams, new URL("teams.yaml", dataDir), parseYaml),
    seasons,
    excluded: await readFileAs(ExcludedVideos, new URL("excluded.json", dataDir), JSON.parse),
  };
}

async function readFileAs<Schema extends z.ZodType>(
  schema: Schema,
  file: URL,
  parseText: (text: string) => unknown,
): Promise<z.output<Schema>> {
  const name = file.pathname.split("/data/").at(-1) ?? file.pathname;

  let content: unknown;
  try {
    content = parseText(await readFile(file, "utf8"));
  } catch (error) {
    throw new DataFileError(`${name}: ${error instanceof Error ? error.message : String(error)}`, {
      cause: error,
    });
  }

  const result = schema.safeParse(content);
  if (!result.success) throw new DataFileError(`${name}:\n${z.prettifyError(result.error)}`);
  return result.data;
}
