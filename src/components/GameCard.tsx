import type { GameSummary } from "../lib/game-summary.ts";
import { thumbnailUrl } from "../lib/youtube-urls.ts";

/** One game in a list: its thumbnail, date, matchup, type and season, linked to its page. */
export function GameCard({ game }: { game: GameSummary }) {
  const [first, second] = game.teams;
  return (
    <li className="game">
      <a className="game__link" href={`/games/${game.id}/`}>
        {/* Decorative: the text beside it says everything the picture could. */}
        <img
          className="game__thumb"
          src={thumbnailUrl(game.videoId)}
          alt=""
          width={320}
          height={180}
          loading="lazy"
          decoding="async"
        />
        <span className="game__body">
          <time className="game__date" dateTime={game.date}>
            {game.dateLabel}
          </time>
          <span className="game__matchup">
            <span className="game__team">{first.name}</span>
            <span className="game__vs">vs</span>
            <span className="game__team">{second.name}</span>
          </span>
          <span className="game__meta">
            <span className={`badge badge--${game.type}`}>{game.typeLabel}</span>
            <span className="game__season">{game.season}</span>
            {game.videoCount > 1 && <span className="game__parts">動画{game.videoCount}本</span>}
          </span>
        </span>
      </a>
    </li>
  );
}
