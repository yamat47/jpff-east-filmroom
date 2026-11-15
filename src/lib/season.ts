const ISO_DATE = /^(\d{4})-(\d{2})-\d{2}$/;

/**
 * The season a game belongs to. A season runs from March 1 to the last day of February of the
 * next year, so January and February belong to the season that started the year before.
 *
 * @param date the game date in Japan time, as YYYY-MM-DD
 */
export function seasonOf(date: string): string {
  const match = ISO_DATE.exec(date);
  // A date written another way ("2026-3-1") would be cut at the wrong places and land in a
  // plausible but wrong season.
  if (match === null) throw new TypeError(`not a date in the form YYYY-MM-DD: ${date}`);

  const year = Number(match[1]);
  const startYear = Number(match[2]) >= 3 ? year : year - 1;
  return `${startYear}-${startYear + 1}`;
}
