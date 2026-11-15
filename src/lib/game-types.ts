// The closed sets of the data model, kept apart from the Zod schema so that code which runs in
// the browser can use them without bringing the validation library along.

export const GAME_TYPES = ["league", "playoff", "allstar", "other"] as const;
export type GameType = (typeof GAME_TYPES)[number];

export const LIVE_STATUSES = ["upcoming", "live", "archived"] as const;
export type LiveStatus = (typeof LIVE_STATUSES)[number];

export const isGameType = (value: string): value is GameType =>
  (GAME_TYPES as readonly string[]).includes(value);
