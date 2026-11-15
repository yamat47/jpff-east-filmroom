import { normalizeSpelling } from "../src/lib/normalize.ts";
import type { GameType, Team } from "../src/lib/schema.ts";
import { indexTeamSpellings } from "../src/lib/team-spellings.ts";

/**
 * One side of the matchup: its spelling in the title, normalized and without the name of the
 * occasion, and the team that spelling names, if any.
 */
export type TitleSide = { readonly spelling: string; readonly teamId: string | null };

/**
 * What the rules read from a video title. Each part is `null` when the title does not carry it
 * in a form the rules know; the caller decides what a missing part means.
 */
export type ParsedTitle = {
  /** The game date at the start of the title, as YYYY-MM-DD. */
  readonly date: string | null;
  /** The two sides in the order of the title, or `null` when the title has no "vs". */
  readonly sides: readonly [TitleSide, TitleSide] | null;
  /** The position of the video in a split game, or `null` when the title marks none. */
  readonly part: number | null;
  /** The game type a keyword in the title names, or `null` when there is none. */
  readonly type: GameType | null;
};

// "2026/10/25", "2026 10 4", "2026-10-04", "2026.10.4", and "20251102" with nothing in between
const LEADING_DATE =
  /^(?:(\d{4})(?:\s*[/.-]\s*|\s)(\d{1,2})(?:\s*[/.-]\s*|\s)(\d{1,2})|(\d{4})(\d{2})(\d{2}))(?!\d)/;

const VERSUS = /\s*vs\.?\s*/i;

// After the second team's name. NFKC has already turned a circled number (①) into a digit. A
// part has one or two digits and starts at 1, so a trailing year is not taken for one.
const PART_MARKERS: readonly {
  readonly pattern: RegExp;
  readonly part: (match: RegExpExecArray) => number;
}[] = [
  { pattern: /\s*前半$/, part: () => 1 },
  { pattern: /\s*後半$/, part: () => 2 },
  { pattern: /\s*part\s*([1-9]\d?)$/i, part: (match) => Number(match[1]) },
  { pattern: /\s+([1-9]\d?)$/, part: (match) => Number(match[1]) },
];

// The first keyword found decides, so the narrower types come before 「ボウル」, which an
// all-star game can carry in its name too.
const TYPE_KEYWORDS: readonly { readonly pattern: RegExp; readonly type: GameType }[] = [
  { pattern: /オールスター|選抜/, type: "allstar" },
  { pattern: /練習試合/, type: "other" },
  { pattern: /プレーオフ|決勝|ボウル|bowl/i, type: "playoff" },
];

/** Reads the game date, the two teams, the part and the game type from a video title. */
export function parseTitle(title: string, teams: readonly Team[]): ParsedTitle {
  const normalized = normalizeSpelling(title);
  const type = TYPE_KEYWORDS.find(({ pattern }) => pattern.test(normalized))?.type ?? null;

  const dateMatch = LEADING_DATE.exec(normalized);
  const date = dateMatch === null ? null : calendarDate(dateMatch);
  // A date that is not on the calendar is still not part of the first team's name.
  const matchup = normalized.slice(dateMatch?.[0].length ?? 0).trim();

  const versus = VERSUS.exec(matchup);
  const first = versus === null ? "" : matchup.slice(0, versus.index);
  const rest = versus === null ? "" : matchup.slice(versus.index + versus[0].length);
  if (first === "" || rest === "") return { date, sides: null, part: null, type };

  const teamOfSpelling = indexTeamSpellings(teams);
  const side = (spelling: string): TitleSide => ({
    spelling,
    teamId: teamOfSpelling.get(spelling) ?? null,
  });
  const firstSide = side(withoutLabel(first, teamOfSpelling));

  // A name that itself ends like a marker ("... 2") is a team first and a part second.
  if (teamOfSpelling.has(rest)) return { date, sides: [firstSide, side(rest)], part: null, type };

  const { second, part } = splitPartMarker(rest);
  return { date, sides: [firstSide, side(second)], part, type };
}

function calendarDate(match: RegExpExecArray): string | null {
  const [year, month, day] = [
    Number(match[1] ?? match[4]),
    Number(match[2] ?? match[5]),
    Number(match[3] ?? match[6]),
  ];
  const date = new Date(Date.UTC(year, month - 1, day));
  // Date rolls an impossible day over into the next month instead of rejecting it.
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date.toISOString().slice(0, 10);
}

/**
 * The first side without the name of the occasion that some titles put before it, as in
 * 「プレーオフ 東海シーガルズ」 or 「2025準決勝 川崎グリズリーズ」. Only words that say what kind
 * of game it is count as such a name: any other word before a team may be part of a team's name,
 * and dropping it would report a team the title does not name.
 */
function withoutLabel(first: string, teamOfSpelling: ReadonlyMap<string, string>): string {
  // A team whose own name has a keyword in it is kept whole.
  if (teamOfSpelling.has(first)) return first;

  // The last word is never the label: a name has to be left after it.
  const words = first.split(" ");
  const lastLabelWord = words
    .slice(0, -1)
    .findLastIndex((word) => TYPE_KEYWORDS.some(({ pattern }) => pattern.test(word)));
  return words.slice(lastLabelWord + 1).join(" ");
}

function splitPartMarker(rest: string): { second: string; part: number | null } {
  for (const { pattern, part } of PART_MARKERS) {
    const match = pattern.exec(rest);
    if (match !== null && match.index > 0) {
      return { second: rest.slice(0, match.index), part: part(match) };
    }
  }
  return { second: rest, part: null };
}
