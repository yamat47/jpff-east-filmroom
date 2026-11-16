import type { GameSummary, TeamSummary } from "./game-summary.ts";

/** A team another team has met, and in how many games of a list. */
export type Opponent = { readonly team: TeamSummary; readonly games: number };

/** The team a team met in a game: of the game's two teams, the one that is not `teamId`. */
export function opponentIn(game: GameSummary, teamId: string): TeamSummary {
  const [first, second] = game.teams;
  if (first.id === teamId) return second;
  if (second.id === teamId) return first;
  throw new Error(`game ${game.id} is not a game of team ${teamId}`);
}

/**
 * The teams a team has met in a list of its games, the one it met most often first. Teams met
 * equally often keep the order in which the list first names them.
 */
export function opponentsOf(games: readonly GameSummary[], teamId: string): Opponent[] {
  const met = new Map<string, { team: TeamSummary; games: number }>();
  for (const game of games) {
    // A game of two other teams has no opponent of this team in it.
    if (!game.teams.some((team) => team.id === teamId)) continue;
    const team = opponentIn(game, teamId);
    const entry = met.get(team.id);
    if (entry === undefined) met.set(team.id, { team, games: 1 });
    else entry.games += 1;
  }
  // The sort is stable, so equal counts stay in the order of the map, which is first met first.
  return [...met.values()].sort((a, b) => b.games - a.games);
}
