import { normalizeSpelling } from "./normalize.ts";
import type { Team } from "./schema.ts";

/** Every spelling that names the team in a title: its name and its aliases, normalized. */
export function spellingsOf(team: Team): Set<string> {
  return new Set([team.name, ...team.aliases].map(normalizeSpelling));
}

/**
 * The team each spelling names. Assumes no spelling names two teams, which `findDataProblems`
 * checks.
 */
export function indexTeamSpellings(teams: readonly Team[]): Map<string, string> {
  return new Map(
    teams.flatMap((team) => [...spellingsOf(team)].map((spelling) => [spelling, team.id])),
  );
}
