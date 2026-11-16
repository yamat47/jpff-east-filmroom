import { pendingStreamOf } from "./live.ts";
import type { Game, SiteData, Team } from "./schema.ts";

/** How many games the top page shows as the newest. */
export const LATEST_LIMIT = 4;

/** How far a game page looks along a team's games: the games after the one shown, and before. */
const AROUND = { later: 2, earlier: 5 } as const;

/** The data arranged the way the pages read it. */
export type Catalog = {
  readonly teams: ReadonlyMap<string, Team>;
  /** Every game, newest first. */
  readonly games: readonly Game[];
  /** Every season that has a game, newest first. */
  readonly seasons: readonly string[];
};

export function buildCatalog(data: SiteData): Catalog {
  const games = data.seasons.flatMap((season) => season.games).sort(newestFirst);
  return {
    teams: new Map(data.teams.map((team) => [team.id, team])),
    games,
    seasons: [...new Set(games.map((game) => game.season))].sort().reverse(),
  };
}

// Two games of one day keep a fixed order, so that a list does not change between builds.
function newestFirst(a: Game, b: Game): number {
  return b.date.localeCompare(a.date) || a.id.localeCompare(b.id);
}

export function gamesOfTeam(catalog: Catalog, teamId: string): Game[] {
  return catalog.games.filter((game) => game.teams.includes(teamId));
}

export function gamesOfSeason(catalog: Catalog, season: string): Game[] {
  return catalog.games.filter((game) => game.season === season);
}

/**
 * The games the top page chooses from, newest first: every game with a stream that has not
 * ended, and as many of the other games as the page shows as the newest. Which of them stand
 * under 「ライブ配信」 is for the clock to say (`splitByLive`), because a stream ends between two
 * builds.
 */
export function topPageGames(catalog: Catalog): Game[] {
  const isPending = (game: Game) => pendingStreamOf(game) !== null;
  const others = catalog.games.filter((game) => !isPending(game)).slice(0, LATEST_LIMIT);
  return catalog.games.filter((game) => isPending(game) || others.includes(game));
}

/** Every season that has a game, newest first, with the number of its games. */
export function seasonsWithGames(catalog: Catalog): { season: string; games: number }[] {
  return catalog.seasons.map((season) => ({
    season,
    games: gamesOfSeason(catalog, season).length,
  }));
}

/** A team that has games, with what its games say about it. */
export type TeamEntry = {
  readonly team: Team;
  readonly games: number;
  readonly firstSeason: string;
  readonly lastSeason: string;
  /** Whether the team has a game in the newest season the catalog has. */
  readonly current: boolean;
};

/**
 * The teams that have at least one game. The teams of the newest season come first, then the
 * teams that play no more, each group in the order of the data file.
 */
export function teamsWithGames(catalog: Catalog): TeamEntry[] {
  const newest = catalog.seasons[0];
  const entries = [...catalog.teams.values()].flatMap((team): TeamEntry[] => {
    const seasons = gamesOfTeam(catalog, team.id)
      .map((game) => game.season)
      .sort();
    const [firstSeason, lastSeason] = [seasons[0], seasons.at(-1)];
    if (firstSeason === undefined || lastSeason === undefined) return [];
    return [
      { team, games: seasons.length, firstSeason, lastSeason, current: lastSeason === newest },
    ];
  });
  return [
    ...entries.filter((entry) => entry.current),
    ...entries.filter((entry) => !entry.current),
  ];
}

/** The other games between the two teams of a game, newest first. */
export function otherMeetings(catalog: Catalog, game: Game): Game[] {
  const [first, second] = game.teams;
  return catalog.games.filter(
    (other) => other.id !== game.id && other.teams.includes(first) && other.teams.includes(second),
  );
}

/** The other games played on the day of a game. */
export function sameDayGames(catalog: Catalog, game: Game): Game[] {
  return catalog.games.filter((other) => other.id !== game.id && other.date === game.date);
}

/**
 * A team's games around one of them, newest first: the game itself, the games that follow it
 * and the games before it, as far as `AROUND` reaches. A game page shows them so that a visitor
 * sees where the game stands in the team's season and goes on from there.
 */
export function gamesAround(catalog: Catalog, game: Game, teamId: string): Game[] {
  const games = gamesOfTeam(catalog, teamId);
  const index = games.findIndex((other) => other.id === game.id);
  if (index === -1) throw new Error(`game ${game.id} is not a game of team ${teamId}`);
  return games.slice(Math.max(0, index - AROUND.later), index + AROUND.earlier + 1);
}
