/**
 * The season a game belongs to. A season runs from March 1 to the last day of February of the
 * next year, so January and February belong to the season that started the year before.
 *
 * @param date the game date in Japan time, as YYYY-MM-DD
 */
export function seasonOf(date: string): string {
  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(5, 7));
  const startYear = month >= 3 ? year : year - 1;
  return `${startYear}-${startYear + 1}`;
}
