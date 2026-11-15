import type { Catalog } from "./catalog.ts";
import type { GameType } from "./game-types.ts";
import { formatDate, TYPE_LABELS } from "./labels.ts";
import type { Game } from "./schema.ts";

/**
 * What a card shows of a game, and what the filter on the top page compares. It is plain data,
 * because the top page hands every game to the browser in this form.
 */
export type GameSummary = {
  readonly id: string;
  readonly date: string;
  readonly dateLabel: string;
  readonly season: string;
  readonly type: GameType;
  readonly typeLabel: string;
  readonly teams: readonly [TeamSummary, TeamSummary];
  /** The first video, whose thumbnail stands for the game. */
  readonly videoId: string;
  readonly videoCount: number;
};

export type TeamSummary = { readonly id: string; readonly name: string };

export function summarize(catalog: Catalog, game: Game): GameSummary {
  const team = (id: string): TeamSummary => {
    const name = catalog.teams.get(id)?.name;
    // `make validate` rules this out, but a build alone does not run it, and a card that showed
    // the ID would link to a team page that is not built.
    if (name === undefined) throw new Error(`game ${game.id}: team ${id} is not in teams.yaml`);
    return { id, name };
  };
  const first = game.videos[0];
  if (first === undefined) throw new Error(`game ${game.id} has no video`);

  return {
    id: game.id,
    date: game.date,
    dateLabel: formatDate(game.date),
    season: game.season,
    type: game.type,
    typeLabel: TYPE_LABELS[game.type],
    teams: [team(game.teams[0]), team(game.teams[1])],
    videoId: first.videoId,
    videoCount: game.videos.length,
  };
}
