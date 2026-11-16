import type { Catalog } from "./catalog.ts";
import type { GameType } from "./game-types.ts";
import { formatDate, TYPE_LABELS } from "./labels.ts";
import { japanTimeOf, type PendingStream, pendingStreamOf } from "./live.ts";
import type { Game, Team } from "./schema.ts";

/**
 * What a list shows of a game, and what the filter beside a list compares. It is plain data,
 * because a page with a filter hands every game of its list to the browser in this form.
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
  /** The stream of the game that has not ended, as far as the data knows. */
  readonly live: LiveSummary | null;
};

/** A stream that has not ended, with its scheduled start as a visitor reads it: "13:00". */
export type LiveSummary = PendingStream & { readonly startLabel: string };

export type TeamSummary = {
  readonly id: string;
  readonly name: string;
  readonly colors: Team["colors"];
};

export function summarizeTeam({ id, name, colors }: Team): TeamSummary {
  return { id, name, colors };
}

export function summarize(catalog: Catalog, game: Game): GameSummary {
  const team = (id: string): TeamSummary => {
    const found = catalog.teams.get(id);
    // `make validate` rules this out, but a build alone does not run it, and a row that showed
    // the ID would link to a team page that is not built.
    if (found === undefined) throw new Error(`game ${game.id}: team ${id} is not in teams.yaml`);
    return summarizeTeam(found);
  };
  const first = game.videos[0];
  if (first === undefined) throw new Error(`game ${game.id} has no video`);
  const stream = pendingStreamOf(game);

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
    live:
      stream === null ? null : { ...stream, startLabel: japanTimeOf(stream.scheduledStartTime) },
  };
}
