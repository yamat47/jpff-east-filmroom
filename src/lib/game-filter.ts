import type { GameSummary } from "./game-summary.ts";
import { type GameType, isGameType } from "./game-types.ts";

/** What a visitor has chosen above a list of games. `null` leaves that filter open. */
export type Selection = {
  readonly season: string | null;
  readonly team: string | null;
  readonly type: GameType | null;
};

/** What a page offers to choose from. A filter the page does not show offers nothing. */
export type Offered = {
  readonly seasons: readonly string[];
  readonly teams: readonly string[];
  readonly types: readonly GameType[];
};

/**
 * The selection a URL query asks for (`?season=2026-2027&team=kamakura-lazaro&type=league`).
 * A value the page does not offer, mistyped or from an old link, selects nothing.
 */
export function selectionFrom(search: string, offered: Offered): Selection {
  const params = new URLSearchParams(search);
  const season = params.get("season");
  const team = params.get("team");
  const type = params.get("type");
  return {
    season: season !== null && offered.seasons.includes(season) ? season : null,
    team: team !== null && offered.teams.includes(team) ? team : null,
    type: type !== null && isGameType(type) && offered.types.includes(type) ? type : null,
  };
}

/** Whether a game is in the list the selection leaves. A team matches on either side. */
export function matchesSelection(game: GameSummary, selection: Selection): boolean {
  return (
    (selection.season === null || game.season === selection.season) &&
    (selection.team === null || game.teams.some((team) => team.id === selection.team)) &&
    (selection.type === null || game.type === selection.type)
  );
}

export function isFiltered(selection: Selection): boolean {
  return selection.season !== null || selection.team !== null || selection.type !== null;
}
