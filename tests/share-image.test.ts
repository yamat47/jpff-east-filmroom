import { describe, expect, it } from "vitest";
import { buildCatalog, teamsWithGames } from "../src/lib/catalog.ts";
import type { TeamSummary } from "../src/lib/game-summary.ts";
import { loadData } from "../src/lib/load-data.ts";
import { type ShareCard, shareCardsOf } from "../src/lib/share-cards.ts";
import {
  drawShareImage,
  LONE_SIZE_MAX,
  nameSizeOf,
  PAIR_SIZE_MAX,
  shareImageResponse,
  titleSizeOf,
} from "../src/lib/share-image.tsx";
import { PAGES, SITE } from "../src/site.ts";

// The data of the site itself: a team that is registered later, or a game that is merged, is
// drawn here too, so a name that does not fit its picture fails the checks of the pull request
// that brings it.
const DATA = await loadData(new URL("../data/", import.meta.url));
const TEAMS = DATA.teams;

const game = (first: TeamSummary, second: TeamSummary): ShareCard => ({
  kind: "game",
  dateLabel: "2026/10/04",
  teams: [first, second],
});

const COLORS: TeamSummary["colors"] = ["#d8232a", "#1b2a4a"];
const team = (name: string): TeamSummary => ({ id: "team", name, colors: COLORS });

/** How far what is drawn stays from each edge of the picture, in pixels. */
async function marginsOf(card: ShareCard) {
  const { width, height } = SITE.shareImage;
  const { pixels } = await drawShareImage(card);
  // The corner is the ground of the picture: nothing is drawn there.
  const [red, green, blue] = pixels;
  const isGround = (at: number) =>
    pixels[at] === red && pixels[at + 1] === green && pixels[at + 2] === blue;

  let left: number = width;
  let right = -1;
  let top: number = height;
  let bottom = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (isGround((y * width + x) * 4)) continue;
      left = Math.min(left, x);
      right = Math.max(right, x);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
    }
  }
  return { left, right: width - 1 - right, top, bottom: height - 1 - bottom };
}

/** The least room the pictures leave on every side. A name that reaches into it is too wide. */
const ROOM = 40;

function expectInside(margins: Awaited<ReturnType<typeof marginsOf>>) {
  for (const side of ["left", "right", "top", "bottom"] as const) {
    expect(margins[side], `the room on the ${side}`).toBeGreaterThanOrEqual(ROOM);
  }
}

describe("nameSizeOf", () => {
  it("writes two short names at the largest size", () => {
    expect(nameSizeOf(["鎌倉ラザロ", "東海シーガルズ"], PAIR_SIZE_MAX)).toBe(76);
  });

  it("writes both names smaller when one of them would not fit on a line", () => {
    // 18 letters, and 1.1 of a letter for the mark before the name.
    const names = ["ワイルドギース", "栃木マダガスカルズ&群馬スタリオンズ"];

    expect(nameSizeOf(names, PAIR_SIZE_MAX)).toBe(54);
    expect(nameSizeOf(names, LONE_SIZE_MAX)).toBe(54);
  });

  it("goes no smaller than the smallest size, however long a name is", () => {
    expect(nameSizeOf(["鎌倉ラザロ", "あ".repeat(24)], PAIR_SIZE_MAX)).toBe(41);
    expect(nameSizeOf(["鎌倉ラザロ", "あ".repeat(25)], PAIR_SIZE_MAX)).toBe(40);
    expect(nameSizeOf(["鎌倉ラザロ", "あ".repeat(60)], PAIR_SIZE_MAX)).toBe(40);
  });
});

describe("the picture of a game", () => {
  it.each(TEAMS.map((each) => [each.name, each] as const))(
    "keeps %s inside the picture, on either line",
    async (_name, each) => {
      expectInside(await marginsOf(game(each, each)));
    },
  );

  it("keeps the longest name of the data inside the picture beside the shortest", async () => {
    const byLength = [...TEAMS].sort((a, b) => a.name.length - b.name.length);
    const [shortest, longest] = [byLength[0], byLength.at(-1)];
    if (shortest === undefined || longest === undefined) throw new Error("the data has no team");

    expectInside(await marginsOf(game(longest, shortest)));
  });

  it.each([
    ["the longest name the smallest size has room for", "あ".repeat(24)],
    ["as long a name of the widest Latin letters", "W".repeat(24)],
    ["a name of Latin and Japanese letters", "JPFF East & 関西選抜オールスターズ"],
  ])("keeps %s inside the picture", async (_case, name) => {
    expectInside(await marginsOf(game(team(name), team("鎌倉ラザロ"))));
  });

  // What the test of the data above fails on: such a name is not written smaller than the
  // smallest size, and a person decides what the picture does with it.
  it("lets a name too long for the smallest size run over the edges", async () => {
    const margins = await marginsOf(game(team("あ".repeat(36)), team("鎌倉ラザロ")));

    expect(Math.min(margins.left, margins.right)).toBeLessThan(ROOM);
  });

  it("draws the names, and not an empty picture", async () => {
    const margins = await marginsOf(game(team("鎌倉ラザロ"), team("東海シーガルズ")));

    // The two names at the largest size are several hundred pixels wide.
    expect(margins.left).toBeLessThan(400);
    expect(margins.right).toBeLessThan(400);
  });
});

describe("titleSizeOf", () => {
  it("writes a short title at the largest size, and a long one smaller", () => {
    expect(titleSizeOf("チーム")).toBe(92);
    expect(titleSizeOf("2026-2027シーズン")).toBe(80);
  });
});

describe("the pictures of the site", () => {
  const catalog = buildCatalog(DATA);
  const cards = [...shareCardsOf(catalog)];

  it("has one for the top page, each game, each team with a game, each season and each list", () => {
    const kinds = Map.groupBy(cards, ([, card]) => card.kind);

    expect(kinds.get("site")).toHaveLength(1);
    expect(kinds.get("game")).toHaveLength(catalog.games.length);
    expect(kinds.get("team")).toHaveLength(teamsWithGames(catalog).length);
    expect(kinds.get("title")).toHaveLength(catalog.seasons.length + Object.keys(PAGES).length);
  });

  // Every picture the build draws: the names of a game on their own lines, a team alone at
  // the larger size, the title of a season and of a list.
  it.each(cards)("keeps the picture of %s inside its edges", async (_path, card) => {
    expectInside(await marginsOf(card));
  });
});

describe("shareImageResponse", () => {
  it("answers with a PNG of the size a shared link asks for", async () => {
    const response = await shareImageResponse({ kind: "site" });
    const png = Buffer.from(await response.arrayBuffer());

    expect(response.headers.get("Content-Type")).toBe("image/png");
    expect(png.subarray(1, 4).toString("latin1")).toBe("PNG");
    expect({ width: png.readUInt32BE(16), height: png.readUInt32BE(20) }).toEqual({
      width: 1200,
      height: 630,
    });
  });
});
