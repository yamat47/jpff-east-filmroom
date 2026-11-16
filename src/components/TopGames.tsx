import { LATEST_LIMIT } from "../lib/catalog.ts";
import type { GameSummary } from "../lib/game-summary.ts";
import { splitByLive } from "../lib/live.ts";
import { GameList } from "./GameList.tsx";
import { useNow } from "./LiveState.tsx";

type Props = {
  /** The games the page chooses from, newest first (`topPageGames`). */
  readonly games: readonly GameSummary[];
};

// The two lists of the top page that a stream moves between. Both read the same games and the
// same clock, so a game is in exactly one of them. They are sent to the browser only while the
// data has a stream that has not ended; on every other day they are plain HTML.

/** 「ライブ配信」: the streams that are scheduled or on air. Nothing when there is none. */
export function LiveGames({ games }: Props) {
  const { live } = splitByLive(games, useNow());
  if (live.length === 0) return null;
  return (
    <section>
      <div className="group__head">
        <h2 className="section-title">ライブ配信</h2>
      </div>
      <GameList games={live} />
    </section>
  );
}

type NewestProps = Props & {
  /** The newest season, which the heading links to. */
  readonly season: { readonly season: string; readonly games: number };
};

/** 「最新の試合」: the newest games that are not under 「ライブ配信」. */
export function NewestGames({ games, season }: NewestProps) {
  // A stream that is over is one of the other games, so they may be more than the list shows.
  const newest = splitByLive(games, useNow()).others.slice(0, LATEST_LIMIT);
  return (
    <section>
      <div className="group__head">
        <h2 className="section-title">最新の試合</h2>
        <a className="more" href={`/seasons/${season.season}/`}>
          {season.season}シーズンの全{season.games}試合
        </a>
      </div>
      <GameList games={newest} layout="cards" />
    </section>
  );
}
