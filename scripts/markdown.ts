// What the reports the scripts render share: the draft of an import, the removal of videos
// that are gone, and the refresh of the live streams.
import type { Game, Team } from "../src/lib/schema.ts";

/** A text inside a table cell, where a bar would end the cell. */
export function cell(text: string): string {
  return text.replaceAll("|", "\\|");
}

/** "1 game", "3 games". */
export function count(n: number, one: string, many: string): string {
  return n === 1 ? `1 ${one}` : `${n} ${many}`;
}

/** 「A vs B」 with the names of the two teams, or their IDs where a team is not registered. */
export function matchupNames(game: Pick<Game, "teams">, teams: readonly Team[]): string {
  const nameOf = new Map(teams.map((team) => [team.id, team.name]));
  return game.teams.map((id) => nameOf.get(id) ?? id).join(" vs ");
}
