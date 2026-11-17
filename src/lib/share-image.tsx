// The picture a link to a page shows where it is shared: one for the site, and one for each
// game with its date and its two teams. They are drawn when the site is built, so a new game
// has its picture without a person drawing one. Only the routes of the pictures import this
// module: it reads font files and runs native code, and none of it reaches the browser.
import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { Resvg } from "@resvg/resvg-js";
import type { CSSProperties, ReactNode } from "react";
import satori from "satori";
import { SITE } from "../site.ts";
import type { GameSummary, TeamSummary } from "./game-summary.ts";

const SIZE = { width: SITE.shareImage.width, height: SITE.shareImage.height };

// A picture cannot read a variable of a stylesheet, but the code that draws it can read the
// stylesheet: the colours, the weights and the line height are the ones of
// src/styles/tokens.css. What is laid down here is what only a picture of this size has: its
// measures, in pixels and in ems of a name, and its grey.
// The file is found from the working directory, as data/ is in site-data.ts: a bundled module
// no longer sits next to it.
const tokens = readFileSync(
  new URL("src/styles/tokens.css", pathToFileURL(`${process.cwd()}/`)),
  "utf8",
);

function token(name: string): string {
  const value = new RegExp(`--${name}:\\s*([^;]+);`).exec(tokens)?.[1];
  if (value === undefined) throw new Error(`src/styles/tokens.css has no --${name}`);
  return value.trim();
}

const INK = token("color-ink");
const PAPER = token("color-paper");
// The picture is the page turned over, paper on ink, so its grey is not the grey of the page:
// it is the paper, let through in part.
const MUTED = 0.7;

// The site serves no font, but a picture needs the shapes of its letters, and the machine that
// builds the site has no Japanese font of its own. So the build brings one, and only its
// drawn letters leave it.
// The package cuts the font by script, and a name of a team may hold both. Each cut has a name
// of its own here: of two files under one name only one would be asked for a letter.
const SCRIPTS = ["latin", "japanese"] as const;
const familyOf = (script: (typeof SCRIPTS)[number]) => `Noto Sans JP ${script}`;
// The weights the package has a file of.
const WEIGHTS = [400, 500, 600, 700] as const;
type Weight = (typeof WEIGHTS)[number];

function weightToken(name: string): Weight {
  const weight = WEIGHTS.find((each) => String(each) === token(name));
  if (weight === undefined) throw new Error(`the font of the pictures has no weight --${name}`);
  return weight;
}

const REGULAR = weightToken("weight-regular");
const BOLD = weightToken("weight-bold");

/**
 * The sizes a team's name is written in, the largest and the smallest, and the width the
 * longer name of a game must fit in. Below the smallest a name is no longer read at the size
 * a shared link is shown in.
 */
const NAME_SIZE_MAX = 76;
const NAME_SIZE_MIN = 40;
const NAME_ROW_WIDTH = 1040;
/** The mark of a team's colours and the gap after it, in ems of the name. */
const MARK_EMS = 0.7;
const MARK_GAP_EMS = 0.4;

const page: CSSProperties = {
  width: "100%",
  height: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: INK,
  color: PAPER,
  fontFamily: SCRIPTS.map(familyOf).join(", "),
  fontWeight: REGULAR,
  lineHeight: Number(token("leading-tight")),
};

/** The picture of every page but a game's: the site's mark, its name, and that it is unofficial. */
export function siteCard(): ReactNode {
  return (
    <div style={page}>
      <Ball size={184} />
      <div style={{ marginTop: 36, fontSize: 64, fontWeight: BOLD }}>{SITE.name}</div>
      <div style={{ marginTop: 20, fontSize: 26, opacity: MUTED }}>{SITE.unofficialNote}</div>
    </div>
  );
}

/** The picture of a game page: the date, the two teams as the page's title has them, the site. */
export function gameCard({
  dateLabel,
  teams,
}: Pick<GameSummary, "dateLabel" | "teams">): ReactNode {
  const [first, second] = teams;
  const size = nameSizeOf([first.name, second.name]);
  return (
    <div style={page}>
      <div style={{ fontSize: 40, opacity: MUTED }}>{dateLabel}</div>
      <div
        style={{ marginTop: 28, display: "flex", flexDirection: "column", alignItems: "center" }}
      >
        <TeamName team={first} size={size} />
        <div style={{ fontSize: Math.round(size * 0.5), opacity: MUTED }}>vs</div>
        <TeamName team={second} size={size} />
      </div>
      <div style={{ marginTop: 52, display: "flex", alignItems: "center" }}>
        <Ball size={36} />
        <div style={{ marginLeft: 14, fontSize: 28, fontWeight: BOLD }}>{SITE.name}</div>
        <div style={{ marginLeft: 20, fontSize: 22, opacity: MUTED }}>{SITE.unofficialNote}</div>
      </div>
    </div>
  );
}

/**
 * The size both names of a game are written in: the largest at which the longer one stays on
 * one line and inside the picture, and never less than the smallest. Every letter is counted
 * as wide as the size. No letter of the font is wider, so a name is never wider than it is
 * counted, whatever it is written in; a name with Latin letters, which are narrower, only
 * comes out a little smaller than it might.
 *
 * A name too long for the smallest size is not made smaller still: it runs over the edges.
 * tests/share-image.test.ts draws every team of the data and fails on such a name, so that a
 * person decides what the picture does with it.
 */
export function nameSizeOf(names: readonly string[]): number {
  const letters = Math.max(...names.map((name) => [...name].length));
  const fitting = Math.floor(NAME_ROW_WIDTH / (letters + MARK_EMS + MARK_GAP_EMS));
  return Math.max(NAME_SIZE_MIN, Math.min(NAME_SIZE_MAX, fitting));
}

/** A team as the pages write it: the dot of its two colours, then its name. */
function TeamName({ team, size }: { team: TeamSummary; size: number }) {
  const [main, second] = team.colors;
  const mark = Math.round(size * MARK_EMS);
  return (
    <div style={{ display: "flex", alignItems: "center", fontSize: size, fontWeight: BOLD }}>
      <div
        style={{
          width: mark,
          height: mark,
          marginRight: Math.round(size * MARK_GAP_EMS),
          borderRadius: mark,
          // The cut of the dot is the one of .team-mark in src/styles/global.css, written
          // again: a change of it there is made here too. The ring keeps a dark colour apart
          // from the ink around it.
          backgroundImage: `linear-gradient(135deg, ${main} 58%, ${second} 58%)`,
          border: `2px solid ${PAPER}`,
        }}
      />
      <div style={{ whiteSpace: "nowrap" }}>{team.name}</div>
    </div>
  );
}

/** The ball of public/favicon.svg, without the square around it. */
function Ball({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="6 6 20 20" aria-hidden="true">
      <path d="M7 25A15 15 0 0 1 25 7 15 15 0 0 1 7 25Z" fill={PAPER} />
      <path
        d="M12 20l8-8M12.1 17.1l2.8 2.8M14.6 14.6l2.8 2.8M17.1 12.1l2.8 2.8"
        fill="none"
        stroke={INK}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

type Font = { name: string; data: Buffer; weight: Weight; style: "normal" };

// The font files are read once for all the pictures of a build.
let fonts: Promise<Font[]> | undefined;

function loadFonts(): Promise<Font[]> {
  const require = createRequire(import.meta.url);
  const files = [REGULAR, BOLD].flatMap((weight) =>
    SCRIPTS.map(async (script): Promise<Font> => {
      const file = `@fontsource/noto-sans-jp/files/noto-sans-jp-${script}-${weight}-normal.woff`;
      const data = await readFile(require.resolve(file));
      return { name: familyOf(script), data, weight, style: "normal" };
    }),
  );
  return Promise.all(files);
}

/** The card as it is drawn, in the size of `SITE.shareImage`: `pixels` holds four bytes (RGBA) for each. */
export async function drawShareImage(
  card: ReactNode,
): Promise<{ readonly pixels: Buffer; asPng(): Buffer }> {
  fonts ??= loadFonts();
  const svg = await satori(card, { ...SIZE, fonts: await fonts });
  // Satori has already drawn the letters as shapes, so the fonts of the machine are not looked
  // for: the picture is the same wherever it is built.
  return new Resvg(svg, { font: { loadSystemFonts: false } }).render();
}

/** The card as the answer of a route: a PNG file. */
export async function shareImageResponse(card: ReactNode): Promise<Response> {
  const png = (await drawShareImage(card)).asPng();
  return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png" } });
}
