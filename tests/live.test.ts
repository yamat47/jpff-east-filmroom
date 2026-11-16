import { describe, expect, it } from "vitest";
import {
  japanDateOf,
  japanTimeOf,
  liveStateAt,
  type PendingStream,
  pendingStreamOf,
  splitByLive,
} from "../src/lib/live.ts";
import type { Video } from "../src/lib/schema.ts";

// A stream scheduled for 13:00 in Japan on December 20.
const START = "2026-12-20T04:00:00Z";
const at = (time: string) => Date.parse(time);

const video = (live: Video["live"]): Video => ({
  videoId: "aaaaaaaaaaa",
  part: 1,
  title: "2026/12/20 ハーバーボウル 鎌倉ラザロvs東海シーガルズ",
  publishedAt: "2026-12-13T03:00:00Z",
  durationSec: live === null || live.status === "archived" ? 5400 : null,
  live,
});

describe("pendingStreamOf", () => {
  it.each(["upcoming", "live"] as const)("finds a stream that is %s", (status) => {
    const live = { status, scheduledStartTime: START };

    expect(pendingStreamOf({ videos: [video(live)] })).toEqual(live);
  });

  it("finds none in a game whose stream has ended", () => {
    const live = { status: "archived", scheduledStartTime: START } as const;

    expect(pendingStreamOf({ videos: [video(live)] })).toBeNull();
  });

  it("finds none in a game of ordinary videos", () => {
    expect(pendingStreamOf({ videos: [video(null), video(null)] })).toBeNull();
  });
});

describe("liveStateAt", () => {
  const upcoming: PendingStream = { status: "upcoming", scheduledStartTime: START };
  const live: PendingStream = { status: "live", scheduledStartTime: START };

  it.each([
    ["scheduled, before its start", upcoming, "2026-12-20T03:59:59Z", "upcoming"],
    ["scheduled, at its start", upcoming, START, "live"],
    ["scheduled, an hour in", upcoming, "2026-12-20T05:00:00Z", "live"],
    ["scheduled, just under four hours in", upcoming, "2026-12-20T07:59:59Z", "live"],
    ["scheduled, four hours in", upcoming, "2026-12-20T08:00:00Z", null],
    ["on air before its scheduled start", live, "2026-12-20T03:30:00Z", "live"],
    ["on air, an hour in", live, "2026-12-20T05:00:00Z", "live"],
    ["on air in the data, four hours in", live, "2026-12-20T08:00:00Z", null],
    ["scheduled, days later", upcoming, "2026-12-23T00:00:00Z", null],
  ] as const)("says of a stream %s: %s", (_case, stream, now, state) => {
    expect(liveStateAt(stream, at(now))).toBe(state);
  });

  it.each([upcoming, live])("leaves the state the data has where there is no clock", (stream) => {
    expect(liveStateAt(stream, null)).toBe(stream.status);
  });
});

describe("splitByLive", () => {
  const game = (id: string, live: PendingStream | null) => ({ id, live });
  const bowl = game("bowl", { status: "upcoming", scheduledStartTime: START });
  const final = game("final", { status: "upcoming", scheduledStartTime: "2026-12-27T04:00:00Z" });
  const games = [final, bowl, game("d", null), game("c", null), game("b", null), game("a", null)];
  const ids = (list: readonly { id: string }[]) => list.map((item) => item.id);

  it("puts the streams that are not over first to start first, and leaves the rest in their order", () => {
    const { live, others } = splitByLive(games, at("2026-12-19T00:00:00Z"));

    expect(ids(live)).toEqual(["bowl", "final"]);
    expect(ids(others)).toEqual(["d", "c", "b", "a"]);
  });

  it("moves a stream that is over to the other games, in its place by date", () => {
    const { live, others } = splitByLive(games, at("2026-12-20T09:00:00Z"));

    expect(ids(live)).toEqual(["final"]);
    expect(ids(others)).toEqual(["bowl", "d", "c", "b", "a"]);
  });

  it("goes by the data where there is no clock", () => {
    const { live, others } = splitByLive(games, null);

    expect(ids(live)).toEqual(["bowl", "final"]);
    expect(ids(others)).toEqual(["d", "c", "b", "a"]);
  });
});

describe("japanDateOf and japanTimeOf", () => {
  it.each([
    ["2026-12-20T04:00:00Z", "2026-12-20", "13:00"],
    ["2026-12-19T15:00:00Z", "2026-12-20", "00:00"],
    ["2026-12-20T14:59:59Z", "2026-12-20", "23:59"],
    ["2027-02-28T15:30:00Z", "2027-03-01", "00:30"],
  ])("reads %s as %s %s in Japan", (instant, date, time) => {
    expect(japanDateOf(instant)).toBe(date);
    expect(japanTimeOf(instant)).toBe(time);
  });

  it("refuses a text that is not a date and time", () => {
    expect(() => japanDateOf("tomorrow")).toThrow(TypeError);
  });
});
