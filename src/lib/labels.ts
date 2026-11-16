import type { TeamEntry } from "./catalog.ts";
import type { GameType } from "./game-types.ts";
import type { LiveState } from "./live.ts";

/** What a visitor reads for each game type. */
export const TYPE_LABELS: Record<GameType, string> = {
  league: "リーグ戦",
  playoff: "プレーオフ",
  allstar: "オールスター",
  other: "その他",
};

/** What a visitor reads of a stream that has not ended: "13:00 配信予定", "配信中". */
export function liveLabel(state: LiveState, startLabel: string): string {
  return state === "live" ? "配信中" : `${startLabel} 配信予定`;
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * A game date as a visitor reads it: "2026/10/04". Every date on the site is written this
 * way, with its year and without a weekday, so that it is as short on a phone as it gets.
 */
export function formatDate(date: string): string {
  const match = ISO_DATE.exec(date);
  if (match === null) throw new TypeError(`not a date in the form YYYY-MM-DD: ${date}`);
  return `${match[1]}/${match[2]}/${match[3]}`;
}

/**
 * How many games a team has. A team that is not in the newest season adds the last season it
 * played: "22試合・2025-2026まで", or "1試合・2018-2019のみ" when that was its only one.
 */
export function teamCountLabel({ games, firstSeason, lastSeason, current }: TeamEntry): string {
  if (current) return `${games}試合`;
  return `${games}試合・${lastSeason}${firstSeason === lastSeason ? "のみ" : "まで"}`;
}

/** The seasons a team's games span, as its page says it under the name. */
export function teamSpanLabel({ firstSeason, lastSeason, current }: TeamEntry): string {
  if (current) return `${firstSeason}シーズンから`;
  return firstSeason === lastSeason
    ? `${firstSeason}シーズン`
    : `${firstSeason}〜${lastSeason}シーズン`;
}

/** The length of a video as a player shows it: "29:57", "1:41:00". */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const pad = (value: number) => String(value).padStart(2, "0");
  const rest = pad(seconds % 60);
  return hours > 0 ? `${hours}:${pad(minutes)}:${rest}` : `${minutes}:${rest}`;
}
