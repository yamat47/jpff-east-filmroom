import { useSyncExternalStore } from "react";
import { isFiltered, matchesSelection, selectionFrom } from "../lib/game-filter.ts";
import type { GameSummary, TeamSummary } from "../lib/game-summary.ts";
import { GAME_TYPES } from "../lib/game-types.ts";
import { TYPE_LABELS } from "../lib/labels.ts";
import { opponentsOf } from "../lib/opponents.ts";
import { groupBySeason as seasonGroups } from "../lib/season-groups.ts";
import { GameList, MATCHUP_WITH_DATE } from "./GameList.tsx";
import type { GameListView } from "./GameRow.tsx";
import { TeamLabel } from "./TeamLabel.tsx";

type Filter = "season" | "team" | "type";

// What a select is called, and what it shows while it narrows nothing.
const FILTER_NAMES: Record<Filter, string> = {
  season: "シーズン",
  team: "チーム",
  type: "種別",
};

// The selection lives in the URL query (/games/?season=2026-2027&team=kamakura-lazaro&type=league),
// so that a filtered list can be bookmarked and sent to someone. The URL is the store.
function subscribe(onChange: () => void): () => void {
  window.addEventListener("popstate", onChange);
  return () => window.removeEventListener("popstate", onChange);
}

// The query of the page's URL. It is empty on the server and during hydration, so that the built
// page shows every game.
function useSearch(): string {
  return useSyncExternalStore(
    subscribe,
    () => window.location.search,
    () => "",
  );
}

function writeQuery(change: Partial<Record<Filter, string>>): void {
  const params = new URLSearchParams(window.location.search);
  for (const [key, value] of Object.entries(change)) {
    if (value === "") params.delete(key);
    else params.set(key, value);
  }
  const query = params.toString();
  window.history.replaceState(null, "", query === "" ? window.location.pathname : `?${query}`);
  // replaceState tells nobody, and the list reads the URL through the popstate subscription.
  window.dispatchEvent(new PopStateEvent("popstate"));
}

type ShownGamesProps = {
  readonly games: readonly GameSummary[];
  /** Whether the list is cut into one list per season, each under its heading. */
  readonly groupBySeason: boolean;
  readonly view: GameListView;
};

// What a filter leaves: the games, or a line that says that none fits.
function ShownGames({ games, groupBySeason, view }: ShownGamesProps) {
  if (games.length === 0) {
    return (
      <div className="empty">
        <p className="empty__title">条件に合う試合がありません</p>
        <p className="empty__hint">絞り込みを変えるか、解除してください。</p>
      </div>
    );
  }
  if (!groupBySeason) return <GameList games={games} view={view} />;
  return (
    <div className="groups">
      {seasonGroups(games).map((group) => (
        <section key={group.season}>
          <div className="group__head">
            <h2 className="section-title">{group.season}シーズン</h2>
            <span className="meta">{group.games.length}試合</span>
          </div>
          <GameList games={group.games} view={view} />
        </section>
      ))}
    </div>
  );
}

type FilteredGamesProps = {
  readonly games: readonly GameSummary[];
  /** Which of the three filters the page offers, in the order they are shown. */
  readonly filters: readonly Filter[];
  /** The teams to choose from, for the pages that offer the team filter. */
  readonly teams?: readonly TeamSummary[];
  readonly groupBySeason?: boolean;
};

/**
 * A list of games with selects above it. Built to HTML with every game in it, so the list and
 * its links work without JavaScript; with it, the selects narrow the list in place.
 */
export function FilteredGames({
  games,
  filters,
  teams = [],
  groupBySeason = false,
}: FilteredGamesProps) {
  const search = useSearch();

  const offers = (filter: Filter) => filters.includes(filter);
  const seasons = offers("season") ? [...new Set(games.map((game) => game.season))] : [];
  const types = offers("type")
    ? GAME_TYPES.filter((type) => games.some((game) => game.type === type))
    : [];
  const offeredTeams = offers("team") ? teams : [];

  const selection = selectionFrom(search, {
    seasons,
    teams: offeredTeams.map((team) => team.id),
    types,
  });
  const shown = games.filter((game) => matchesSelection(game, selection));

  const options: Record<Filter, readonly (readonly [value: string, text: string])[]> = {
    season: seasons.map((season) => [season, season]),
    team: offeredTeams.map((team) => [team.id, team.name]),
    type: types.map((type) => [type, TYPE_LABELS[type]]),
  };

  return (
    <div className="filtered">
      <div className="filtered__controls">
        <form className="filter" onSubmit={(event) => event.preventDefault()}>
          {filters.map((filter) => (
            <span
              key={filter}
              // Team names are the longest values, so their select gets the most room.
              className={filter === "team" ? "filter__field filter__field--wide" : "filter__field"}
            >
              <select
                aria-label={FILTER_NAMES[filter]}
                value={selection[filter] ?? ""}
                data-selected={selection[filter] === null ? undefined : ""}
                onChange={(event) => writeQuery({ [filter]: event.target.value })}
              >
                <option value="">{FILTER_NAMES[filter]}</option>
                {options[filter].map(([value, text]) => (
                  <option key={value} value={value}>
                    {text}
                  </option>
                ))}
              </select>
            </span>
          ))}
        </form>
        <div className="filtered__status">
          <p aria-live="polite">{shown.length}試合</p>
          {isFiltered(selection) && (
            <button
              className="filter__reset"
              type="button"
              onClick={() => writeQuery({ season: "", team: "", type: "" })}
            >
              絞り込みを解除
            </button>
          )}
        </div>
      </div>
      <ShownGames games={shown} groupBySeason={groupBySeason} view={MATCHUP_WITH_DATE} />
    </div>
  );
}

type TeamGamesProps = {
  /** The team whose page this is. */
  readonly teamId: TeamSummary["id"];
  /** Every game of the team, newest first. */
  readonly games: readonly GameSummary[];
};

/**
 * A team's games under their seasons, with its opponents beside the list as the filter. A row
 * names the opponent alone. Without JavaScript the opponents are hidden and every game stands.
 *
 * The opponents are few enough to stand on the page, so they are buttons and not a select: a
 * row to swipe on a phone, a column beside the list on a desk.
 */
export function TeamGames({ teamId, games }: TeamGamesProps) {
  const search = useSearch();
  const opponents = opponentsOf(games, teamId);
  // The opponent is the team filter of this page: /teams/{id}/?team={opponent}.
  const selection = selectionFrom(search, {
    seasons: [],
    teams: opponents.map(({ team }) => team.id),
    types: [],
  });
  const selected = selection.team;
  const shown = games.filter((game) => matchesSelection(game, selection));

  return (
    <div className="with-rail">
      <div className="rail rail--filter">
        <h2 className="rail__title">対戦相手</h2>
        <ul className="chip-row opponents">
          <li>
            <button
              className="chip"
              type="button"
              aria-pressed={selected === null}
              onClick={() => writeQuery({ team: "" })}
            >
              <span className="team">
                {/* A ring without colours, so that the word starts where the names start. */}
                <span className="team-mark team-mark--none" aria-hidden="true" />
                <span className="team__name">すべて</span>
              </span>
              <span className="chip__count meta">
                {games.length}
                <span className="visually-hidden">試合</span>
              </span>
            </button>
          </li>
          {opponents.map(({ team, games: met }) => (
            <li key={team.id}>
              <button
                className="chip"
                type="button"
                aria-pressed={selected === team.id}
                onClick={() => writeQuery({ team: team.id })}
              >
                <TeamLabel team={team} />
                <span className="chip__count meta">
                  {met}
                  <span className="visually-hidden">試合</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="with-rail__main">
        <p className="visually-hidden" aria-live="polite">
          {shown.length}試合
        </p>
        <ShownGames games={shown} groupBySeason view={{ kind: "opponent", of: teamId }} />
      </div>
    </div>
  );
}
