import type { GameType } from "./game-types.ts";

/** What a visitor reads for each game type. */
export const TYPE_LABELS: Record<GameType, string> = {
  league: "リーグ戦",
  playoff: "プレーオフ",
  allstar: "オールスター",
  other: "その他",
};

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"] as const;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** A game date as a visitor reads it: "2026年10月4日(日)". */
export function formatDate(date: string): string {
  const match = ISO_DATE.exec(date);
  if (match === null) throw new TypeError(`not a date in the form YYYY-MM-DD: ${date}`);
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  // Built in UTC, so that the weekday does not depend on where the site is built.
  const weekday = WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  return `${year}年${month}月${day}日(${weekday})`;
}

/** The length of a video as a player shows it: "29:57", "1:41:00". */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const pad = (value: number) => String(value).padStart(2, "0");
  const rest = pad(seconds % 60);
  return hours > 0 ? `${hours}:${pad(minutes)}:${rest}` : `${minutes}:${rest}`;
}
