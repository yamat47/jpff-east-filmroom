import { readdir, readFile } from "node:fs/promises";
import { parse as parseYaml } from "yaml";
import { z } from "zod";
import { ExcludedVideos, Games, SeasonId, type SiteData, Teams } from "./schema.ts";

/** A file under data/ that cannot be read as what it should hold. */
export class DataFileError extends Error {
  override readonly name = "DataFileError";
}

/** Reads everything under the data directory and checks each file against its schema. */
export async function loadData(dataDir: URL): Promise<SiteData> {
  // Every file in games/ is read or refused. One that was skipped for its name would keep its
  // games off the site while the check stays green.
  const gameFiles = (await readdir(new URL("games/", dataDir)))
    .filter((name) => !name.startsWith("."))
    .sort();

  const seasons = await Promise.all(
    gameFiles.map(async (name) => {
      const file = `games/${name}`;
      const season = SeasonId.safeParse(name.endsWith(".json") ? name.slice(0, -5) : name);
      if (!season.success) {
        throw new DataFileError(
          `${file}: a game file is named after its season, as in 2026-2027.json`,
        );
      }
      return { season: season.data, games: await readFileAs(Games, dataDir, file, JSON.parse) };
    }),
  );

  return {
    teams: await readFileAs(Teams, dataDir, "teams.yaml", parseYaml),
    seasons,
    excluded: await readFileAs(ExcludedVideos, dataDir, "excluded.json", JSON.parse),
  };
}

async function readFileAs<Schema extends z.ZodType>(
  schema: Schema,
  dataDir: URL,
  file: string,
  parseText: (text: string) => unknown,
): Promise<z.output<Schema>> {
  let content: unknown;
  try {
    content = parseText(await readFile(new URL(file, dataDir), "utf8"));
  } catch (error) {
    throw new DataFileError(`${file}: ${error instanceof Error ? error.message : String(error)}`, {
      cause: error,
    });
  }

  const result = schema.safeParse(content);
  if (!result.success) throw new DataFileError(`${file}:\n${z.prettifyError(result.error)}`);
  return result.data;
}
