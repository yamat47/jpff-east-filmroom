import type { GameSummary } from "../lib/game-summary.ts";
import { thumbnailUrl } from "../lib/youtube-urls.ts";

/** One game in a list: its thumbnail, the two teams, the date and the type, linked to its page. */
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
          <span className="game__teams">
            <span>{first.name}</span>
            {/* The two lines show that these teams met; a screen reader needs the word. */}
            <span className="visually-hidden">vs</span>
            <span>{second.name}</span>
          </span>
          <span className="game__meta">
            <time dateTime={game.date}>{game.dateLabel}</time>・{game.typeLabel}
            {game.videoCount > 1 && `・動画${game.videoCount}本`}
          </span>
        </span>
      </a>
    </li>
  );
}
