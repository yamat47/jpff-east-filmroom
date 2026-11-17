// Prints an ID for a game a person places by hand: one that no game of the data has.
// `make game-id`. The import gives the games it drafts their IDs by itself.
import { randomInt } from "node:crypto";
import { newGameId } from "../src/lib/game-id.ts";
import { loadData } from "../src/lib/load-data.ts";

const data = await loadData(new URL("../data/", import.meta.url));
const taken = new Set(data.seasons.flatMap((season) => season.games.map((game) => game.id)));

console.log(newGameId(taken, randomInt));
