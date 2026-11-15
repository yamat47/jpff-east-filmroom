import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { DataFileError, loadData } from "../src/lib/load-data.ts";

const TEAMS = `
- id: kamakura-lazaro
  name: 鎌倉ラザロ
- id: tokai-seagulls
  name: 東海シーガルズ
`;

const GAME = {
  id: "2026-10-04-kamakura-lazaro-vs-tokai-seagulls",
  date: "2026-10-04",
  season: "2026-2027",
  type: "league",
  teams: ["kamakura-lazaro", "tokai-seagulls"],
  needsReview: false,
  videos: [
    {
      videoId: "aaaaaaaaaaa",
      part: 1,
      title: "2026 10 4 鎌倉ラザロvs東海シーガルズ",
      publishedAt: "2026-10-06T03:00:00Z",
      durationSec: 1538,
      live: null,
    },
  ],
};

const directories: string[] = [];

/** Writes a data directory holding the given files, with valid defaults for the rest. */
async function dataDirWith(files: Record<string, string>): Promise<URL> {
  const directory = await mkdtemp(join(tmpdir(), "filmroom-data-"));
  directories.push(directory);
  await mkdir(join(directory, "games"));

  const all = { "teams.yaml": TEAMS, "excluded.json": "[]", ...files };
  await Promise.all(
    Object.entries(all).map(([name, content]) => writeFile(join(directory, name), content)),
  );
  return pathToFileURL(`${directory}/`);
}

afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true })));
});

describe("loadData", () => {
  it("reads the teams, the excluded videos and each season's games, named by its file", async () => {
    const dataDir = await dataDirWith({
      "games/2025-2026.json": "[]",
      "games/2026-2027.json": JSON.stringify([GAME]),
      "excluded.json": JSON.stringify([
        { videoId: "bbbbbbbbbbb", title: "開会式", reason: "a ceremony" },
      ]),
    });

    const data = await loadData(dataDir);

    expect(data.teams.map((team) => team.id)).toEqual(["kamakura-lazaro", "tokai-seagulls"]);
    expect(data.seasons).toEqual([
      { season: "2025-2026", games: [] },
      { season: "2026-2027", games: [GAME] },
    ]);
    expect(data.excluded.map((video) => video.videoId)).toEqual(["bbbbbbbbbbb"]);
  });

  it.each([
    ["games/2026.json", "a single year"],
    ["games/2026-2028.json", "years that are not consecutive"],
    ["games/2026-2027.JSON", "an extension in upper case"],
    ["games/2026-2027.json.bak", "a backup beside the real file"],
  ])("refuses the game file %s, which has %s", async (file) => {
    const dataDir = await dataDirWith({ [file]: "[]" });

    await expect(loadData(dataDir)).rejects.toThrow(
      new DataFileError(`${file}: a game file is named after its season, as in 2026-2027.json`),
    );
  });

  it("names the file and the field when a game does not fit the schema", async () => {
    const dataDir = await dataDirWith({
      "games/2026-2027.json": JSON.stringify([{ ...GAME, type: "friendly" }]),
    });

    const error = await loadData(dataDir).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(DataFileError);
    expect(error).toHaveProperty("message", expect.stringContaining("games/2026-2027.json:"));
    expect(error).toHaveProperty("message", expect.stringContaining("at [0].type"));
  });

  it("names the file when its JSON cannot be parsed", async () => {
    const dataDir = await dataDirWith({ "games/2026-2027.json": "[{" });

    const error = await loadData(dataDir).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(DataFileError);
    expect(error).toHaveProperty("message", expect.stringMatching(/^games\/2026-2027\.json: /));
  });

  it("names the file when its YAML cannot be parsed", async () => {
    const dataDir = await dataDirWith({ "teams.yaml": "- id: [unclosed" });

    const error = await loadData(dataDir).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(DataFileError);
    expect(error).toHaveProperty("message", expect.stringMatching(/^teams\.yaml: /));
  });
});
