// Checks the files under data/: each against its schema, then all of them against each other.
// CI runs it on every pull request, so a pull request with inconsistent data cannot be merged.
import { findDataProblems } from "../src/lib/data-problems.ts";
import { DataFileError, loadData } from "../src/lib/load-data.ts";

const DATA_DIR = new URL("../data/", import.meta.url);

try {
  const data = await loadData(DATA_DIR);
  const problems = findDataProblems(data);

  if (problems.length > 0) {
    for (const problem of problems) console.error(problem);
    process.exitCode = 1;
  } else {
    const games = data.seasons.reduce((count, season) => count + season.games.length, 0);
    console.log(
      `data is consistent: ${data.teams.length} teams, ${games} games in ${data.seasons.length} seasons, ${data.excluded.length} excluded videos`,
    );
  }
} catch (error) {
  if (!(error instanceof DataFileError)) throw error;
  console.error(error.message);
  process.exitCode = 1;
}
