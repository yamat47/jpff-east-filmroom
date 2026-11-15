import { useId, useSyncExternalStore } from "react";
import { isFiltered, matchesSelection, selectionFrom } from "../lib/game-filter.ts";
import type { GameSummary, TeamSummary } from "../lib/game-summary.ts";
import { GAME_TYPES } from "../lib/game-types.ts";
import { TYPE_LABELS } from "../lib/labels.ts";
import { GameList } from "./GameList.tsx";

type Filter = "season" | "team" | "type";

type Props = {
  readonly games: readonly GameSummary[];
  /** Which of the three filters the page offers, in the order they are shown. */
  readonly filters: readonly Filter[];
  /** The teams to choose from, for the pages that offer the team filter. */
  readonly teams?: readonly TeamSummary[];
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
export function FilteredGames({ games, filters, teams = [] }: Props) {
  // Empty on the server and during hydration: the built page shows every game.
  const search = useSyncExternalStore(
    subscribe,
    () => window.location.search,
    () => "",
  );
  const formId = useId();

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

  const select = (filter: Filter, label: string, options: readonly (readonly [string, string])[]) =>
    offers(filter) && (
      <label className="filter__field" htmlFor={`${formId}-${filter}`}>
        <span className="filter__label">{label}</span>
        <select
          id={`${formId}-${filter}`}
          value={selection[filter] ?? ""}
          onChange={(event) => writeQuery({ [filter]: event.target.value })}
        >
          <option value="">すべて</option>
          {options.map(([value, text]) => (
            <option key={value} value={value}>
              {text}
            </option>
          ))}
        </select>
      </label>
    );

  return (
    <div className="filtered">
      <form className="filter" onSubmit={(event) => event.preventDefault()}>
        {select(
          "season",
          "シーズン",
          seasons.map((season) => [season, season] as const),
        )}
        {select(
          "team",
          "チーム",
          offeredTeams.map((team) => [team.id, team.name] as const),
        )}
        {select(
          "type",
          "種別",
          types.map((type) => [type, TYPE_LABELS[type]] as const),
        )}
        {isFiltered(selection) && (
          <button
            className="filter__reset"
            type="button"
            onClick={() => writeQuery({ season: "", team: "", type: "" })}
          >
            絞り込みを解除
          </button>
        )}
      </form>
      <p className="filtered__count" aria-live="polite">
        {shown.length}試合
      </p>
      {shown.length > 0 ? (
        <GameList games={shown} />
      ) : (
        <p className="filtered__empty">条件に合う試合がありません。絞り込みを解除してください。</p>
      )}
    </div>
  );
}
