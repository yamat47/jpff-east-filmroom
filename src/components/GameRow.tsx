import type { GameSummary } from "../lib/game-summary.ts";
import { opponentIn } from "../lib/opponents.ts";
import { thumbnailUrl } from "../lib/youtube-urls.ts";
import { LiveState } from "./LiveState.tsx";
import { TeamLabel } from "./TeamLabel.tsx";

/**
 * What a row says of its game. A row leaves out what the page around it has already said:
 *
 * - `matchup`: both teams, and the date except on the page of that day.
 * - `opponent`: the date and the other team alone, on the page of the team `of`.
 * - `date`: the date alone, in a list of the meetings of two teams.
 */
export type GameListView =
  | { readonly kind: "matchup"; readonly withDate: boolean }
  | { readonly kind: "opponent"; readonly of: string }
  | { readonly kind: "date" };

/** One game in a list: its thumbnail and what the view asks for, linked to the game's page. */
export function GameRow({ game, view }: { game: GameSummary; view: GameListView }) {
  const [first, second] = game.teams;
  const type = game.videoCount > 1 ? `${game.typeLabel}・動画${game.videoCount}本` : game.typeLabel;
  const date = view.kind === "matchup" && !view.withDate ? null : game.dateLabel;
  // On a line of its own, under what the row is about: the teams, or the date where a row has
  // no team.
  const live = game.live !== null && <LiveState live={game.live} />;

  return (
    <li className={view.kind === "date" ? "game-row game-row--date" : "game-row"}>
      <a className="game-row__link row-link" href={`/games/${game.id}/`}>
        {/* Decorative: the text beside it says everything the picture could. */}
        <img
          className="game-row__thumb"
          src={thumbnailUrl(game.videoId)}
          alt=""
          width={320}
          height={180}
          loading="lazy"
          decoding="async"
        />
        <span className="game-row__meta">
          {date !== null && (
            <time className="game-row__date" dateTime={game.date}>
              {date}
            </time>
          )}
          <span className="game-row__type">{type}</span>
          {view.kind === "date" && live}
        </span>
        {view.kind === "matchup" && (
          <span className="game-row__teams">
            <TeamLabel team={first} />
            <span className="versus">
              {/* Where the two teams stand one above the other, their marks in a line say that
                  they met, and the word is not drawn. A screen reader gets it everywhere. */}
              <span className="visually-hidden">vs</span>
              <span className="versus__vs game-row__vs" aria-hidden="true">
                vs
              </span>
              <TeamLabel team={second} />
            </span>
            {live}
          </span>
        )}
        {view.kind === "opponent" && (
          <span className="game-row__teams game-row__teams--subject">
            <span className="versus">
              <span className="versus__vs">vs</span>
              <TeamLabel team={opponentIn(game, view.of)} />
            </span>
            {live}
          </span>
        )}
      </a>
    </li>
  );
}
