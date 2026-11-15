/** The games of one season, in the order they were given. */
export type SeasonGroup<T> = { readonly season: string; readonly games: readonly T[] };

/**
 * A list of games cut into one list per season, the newest season first. A season without a
 * game gets no group.
 *
 * The groups are ordered by season, not by the first game met: a game moved by hand into the
 * season before its date (a final that slips into March) would otherwise put that season above
 * the one that has begun.
 */
export function groupBySeason<T extends { readonly season: string }>(
  games: readonly T[],
): SeasonGroup<T>[] {
  const groups = new Map<string, T[]>();
  for (const game of games) {
    const group = groups.get(game.season);
    if (group === undefined) groups.set(game.season, [game]);
    else group.push(game);
  }
  return [...groups]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([season, group]) => ({ season, games: group }));
}
