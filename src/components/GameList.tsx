import type { GameSummary } from "../lib/game-summary.ts";
import { type GameListView, GameRow } from "./GameRow.tsx";

type Props = {
  readonly games: readonly GameSummary[];
  /** What a row says of its game. Both teams and the day, unless the page asks for another. */
  readonly view?: GameListView;
  /**
   * How the games stand on a desk: `rows` of one line each, or `cards` side by side with the
   * thumbnail on top, for the few newest games of the top page. On a phone both are rows.
   */
  readonly layout?: "rows" | "cards";
};

/** The view of a list whose page has said nothing of its games: both teams and the day. */
export const MATCHUP_WITH_DAY: GameListView = { kind: "matchup", date: "day" };

export function GameList({ games, view = MATCHUP_WITH_DAY, layout = "rows" }: Props) {
  return (
    <ul className={`game-list game-list--${layout}`}>
      {games.map((game) => (
        <GameRow key={game.id} game={game} view={view} />
      ))}
    </ul>
  );
}
