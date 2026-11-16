import type { GameSummary, TeamSummary } from "../lib/game-summary.ts";
import { opponentIn } from "../lib/opponents.ts";
import type { SeasonGroup } from "../lib/season-groups.ts";
import { TeamLabel } from "./TeamLabel.tsx";

type Props = {
  readonly team: TeamSummary;
  /** How many games the team has in all, for the link to its page. */
  readonly total: number;
  /** The team's games around the one on the page, under their seasons. */
  readonly seasons: readonly SeasonGroup<GameSummary>[];
  /** The game on the page, which is marked in the list and links nowhere. */
  readonly currentId: string;
};

/**
 * One team's games around the game on the page, beside the video. A row names the opponent
 * alone, because the heading names the team.
 */
export function TeamTimeline({ team, total, seasons, currentId }: Props) {
  return (
    <section>
      <div className="group__head">
        <h2 className="section-title">
          <TeamLabel team={team} />
        </h2>
        <a className="more" href={`/teams/${team.id}/`}>
          <span className="visually-hidden">{team.name}の</span>全{total}試合
        </a>
      </div>
      {seasons.map((group) => (
        <div key={group.season}>
          <h3 className="timeline__season">{group.season}シーズン</h3>
          <ul className="timeline__list">
            {group.games.map((game) => (
              <li key={game.id}>
                {game.id === currentId ? (
                  <span className="timeline__row" aria-current="true">
                    <TimelineGame game={game} team={team} />
                    <span className="timeline__here">この試合</span>
                  </span>
                ) : (
                  <a className="timeline__row row-link" href={`/games/${game.id}/`}>
                    <TimelineGame game={game} team={team} />
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}

function TimelineGame({ game, team }: { game: GameSummary; team: TeamSummary }) {
  return (
    <span className="timeline__game">
      <span className="versus timeline__opponent">
        <span className="versus__vs">vs</span>
        <TeamLabel team={opponentIn(game, team.id)} />
      </span>
      <span className="meta">
        <time dateTime={game.date}>{game.dayLabel}</time>・{game.typeLabel}
      </span>
    </span>
  );
}
