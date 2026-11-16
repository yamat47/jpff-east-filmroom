import { useSyncExternalStore } from "react";
import { isFiltered, matchesSelection, selectionFrom } from "../lib/game-filter.ts";
import type { GameSummary, TeamSummary } from "../lib/game-summary.ts";
import { GAME_TYPES } from "../lib/game-types.ts";
import { TYPE_LABELS } from "../lib/labels.ts";
import { groupBySeason as seasonGroups } from "../lib/season-groups.ts";
import { GameList } from "./GameList.tsx";

type Filter = "season" | "team" | "type";

type Props = {
  readonly games: readonly GameSummary[];
  /** Which of the three filters the page offers, in the order they are shown. */
  readonly filters: readonly Filter[];
  /** The teams to choose from, for the pages that offer the team filter. */
  readonly teams?: readonly TeamSummary[];
  /** Whether the list is cut into one list per season, each under its heading. */
  readonly groupBySeason?: boolean;
};

// What a select is called, and what it shows while it narrows nothing.
const FILTER_NAMES: Record<Filter, string> = {
  season: "シーズン",
  team: "チーム",
  type: "種別",
};

// The selection lives in the URL query (/?season=2026-2027&team=kamakura-lazaro&type=league), so
// that a filtered list can be bookmarked and sent to someone. The URL is the store.
function subscribe(onChange: () => void): () => void {
  window.addEventListener("popstate", onChange);
  return () => window.removeEventListener("popstate", onChange);
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

/**
 * A list of games with the filters the page offers. Built to HTML with every game in it, so the
 * list and its links work without JavaScript; with it, the selects narrow the list in place.
 */
export function FilteredGames({ games, filters, teams = [], groupBySeason = false }: Props) {
  // Empty on the server and during hydration: the built page shows every game.
  const search = useSyncExternalStore(
    subscribe,
    () => window.location.search,
    () => "",
  );

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
      {shown.length === 0 ? (
        <div className="empty">
          <p className="empty__title">条件に合う試合がありません</p>
          <p className="empty__hint">絞り込みを変えるか、解除してください。</p>
        </div>
      ) : groupBySeason ? (
        <div className="groups">
          {seasonGroups(shown).map((group) => (
            <section key={group.season}>
              <div className="group__head">
                <h2 className="section-title">{group.season}シーズン</h2>
              </div>
              <GameList games={group.games} />
            </section>
          ))}
        </div>
      ) : (
        <GameList games={shown} />
      )}
    </div>
  );
}
