import type { Game } from "./schema.ts";

/** The ID a game must carry: its date and its two teams in the order of the title. */
export function gameIdOf(game: Pick<Game, "date" | "teams">): string {
  return `${game.date}-${game.teams[0]}-vs-${game.teams[1]}`;
}
