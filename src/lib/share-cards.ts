import { PAGES } from "../site.ts";
import { type Catalog, teamsWithGames } from "./catalog.ts";
import { type GameSummary, summarize, summarizeTeam, type TeamSummary } from "./game-summary.ts";
import { seasonTitle } from "./labels.ts";

/**
 * What the picture of a shared link shows, by the kind of page it belongs to. Plain data: the
 * page shell reads the list below to know which pages have a picture, and must not load the
 * code that draws one (src/lib/share-image.tsx).
 */
export type ShareCard =
  | { readonly kind: "site" }
  | { readonly kind: "game"; readonly dateLabel: string; readonly teams: GameSummary["teams"] }
  | { readonly kind: "team"; readonly team: TeamSummary }
  | { readonly kind: "title"; readonly title: string };

/**
 * The picture of every page that has one, by the path of the page. The pictures are built from
 * this list and the page shell looks a page up in it, so no page names a picture that was not
 * drawn: a page that is not here shows the picture of the site.
 */
export function shareCardsOf(catalog: Catalog): Map<string, ShareCard> {
  const titled = (title: string): ShareCard => ({ kind: "title", title });
  return new Map<string, ShareCard>([
    ["/", { kind: "site" }],
    ...Object.values(PAGES).map(({ href, title }) => [href, titled(title)] as const),
    ...catalog.games.map((game) => {
      const { dateLabel, teams } = summarize(catalog, game);
      return [`/games/${game.id}/`, { kind: "game", dateLabel, teams }] as const;
    }),
    ...teamsWithGames(catalog).map(
      ({ team }) => [`/teams/${team.id}/`, { kind: "team", team: summarizeTeam(team) }] as const,
    ),
    ...catalog.seasons.map(
      (season) => [`/seasons/${season}/`, titled(seasonTitle(season))] as const,
    ),
  ]);
}
