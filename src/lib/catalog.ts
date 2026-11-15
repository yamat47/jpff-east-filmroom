import type { Game, SiteData, Team } from "./schema.ts";

/** How many games a list of related games shows before it points at the full list. */
export const RELATED_LIMIT = 10;

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

/** The teams that have at least one game, in the order of the data file. */
export function teamsWithGames(catalog: Catalog): { team: Team; games: number }[] {
  return [...catalog.teams.values()]
    .map((team) => ({ team, games: gamesOfTeam(catalog, team.id).length }))
    .filter((entry) => entry.games > 0);
}

/** A list cut to what a game page shows, with the number of games it was cut from. */
export type RelatedList = { readonly games: readonly Game[]; readonly total: number };

/**
 * Where a visitor goes on from a game: the other games of each of its two teams and the other
 * games of its season, newest first. The game itself is in none of the lists.
 */
export function relatedGames(
  catalog: Catalog,
  game: Game,
): { readonly teams: readonly [RelatedList, RelatedList]; readonly season: RelatedList } {
  const others = (games: readonly Game[]): RelatedList => {
    const rest = games.filter((other) => other.id !== game.id);
    return { games: rest.slice(0, RELATED_LIMIT), total: rest.length };
  };
  return {
    teams: [
      others(gamesOfTeam(catalog, game.teams[0])),
      others(gamesOfTeam(catalog, game.teams[1])),
    ],
    season: others(gamesOfSeason(catalog, game.season)),
  };
}
