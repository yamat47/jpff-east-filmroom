import { useSyncExternalStore } from "react";
import type { LiveSummary } from "../lib/game-summary.ts";
import { liveLabel } from "../lib/labels.ts";
import { liveStateAt } from "../lib/live.ts";

// The data is as old as the last build, so the browser reads the clock: a stream goes from
// scheduled to on air, and to a game like any other, without a new build (requirements,
// section 8). The clock is the store, read once per tick.
const TICK_MS = 30_000;

// One timer for the page, whatever reads the clock: every reader hears the same tick, so two
// lists that a stream moves between never disagree about where it is.
const readers = new Set<() => void>();
let timer: number | undefined;

function tick(): void {
  for (const reader of readers) reader();
}

function subscribe(onChange: () => void): () => void {
  if (readers.size === 0) {
    timer = window.setInterval(tick, TICK_MS);
    // A tab in the background runs its timers late, so a page that comes back is read again.
    document.addEventListener("visibilitychange", tick);
  }
  readers.add(onChange);
  return () => {
    readers.delete(onChange);
    if (readers.size > 0) return;
    window.clearInterval(timer);
    document.removeEventListener("visibilitychange", tick);
  };
}

// Cut to the tick, so that two readings between two ticks are the same value.
const currentTick = () => Math.floor(Date.now() / TICK_MS) * TICK_MS;

/**
 * The time, in milliseconds. It is `null` at the build, during hydration and in a component
 * that is not sent to the browser: there the state the data has stands.
 */
export function useNow(): number | null {
  return useSyncExternalStore(subscribe, currentTick, () => null);
}

type Props = {
  readonly live: LiveSummary;
  /** The element the line is: a line of its own in a row, a paragraph under a page title. */
  readonly as?: "span" | "p";
};

/** 「13:00 配信予定」 or 「配信中」, and nothing once the stream is taken to be over. */
export function LiveState({ live, as: Tag = "span" }: Props) {
  const state = liveStateAt(live, useNow());
  if (state === null) return null;
  return (
    <Tag className="live-state" data-state={state}>
      {liveLabel(state, live.startLabel)}
    </Tag>
  );
}
