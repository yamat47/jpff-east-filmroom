import type { Game } from "./schema.ts";

/**
 * The letters and digits of a game ID, and how many an ID has. Without the ones that are read
 * as one another: 0 and o, 1, l and i. The schema takes the form of an ID from these two.
 */
export const GAME_ID_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
export const GAME_ID_LENGTH = 8;

/**
 * An ID for a new game: letters and digits that say nothing of the game. It is the URL of the
 * game's page, and a correction of the date or of the teams must not change that URL.
 *
 * `pick(n)` gives a whole number from 0 up to n, n not included. The caller brings the chance,
 * so that a test can fix it. An ID in `taken` is not given again.
 */
export function newGameId(taken: ReadonlySet<string>, pick: (below: number) => number): string {
  for (;;) {
    const id = Array.from({ length: GAME_ID_LENGTH }, () =>
      GAME_ID_ALPHABET.charAt(pick(GAME_ID_ALPHABET.length)),
    ).join("");
    if (!taken.has(id)) return id;
  }
}

/**
 * What makes a game the game it is, now that its ID says nothing: its date and its two teams,
 * whichever of the two a title names first. No two games of the data share it.
 */
export function matchupOf(game: Pick<Game, "date" | "teams">): string {
  return [game.date, ...[...game.teams].sort()].join(" ");
}

/**
 * The order a season file keeps its games in, and the order of the games of one day on a page:
 * by date, then by the two teams. `make validate` refuses two games of the same teams on one
 * day; the ID is compared last only so that data that was not checked has one order too.
 */
export function byDateAndTeams(a: Game, b: Game): number {
  return a.date.localeCompare(b.date) || byTeams(a, b);
}

/** The order of two games of one day. */
export function byTeams(a: Game, b: Game): number {
  return (
    a.teams[0].localeCompare(b.teams[0]) ||
    a.teams[1].localeCompare(b.teams[1]) ||
    a.id.localeCompare(b.id)
  );
}
