import type { GameSummary } from "../lib/game-summary.ts";
import { GameCard } from "./GameCard.tsx";

export function GameList({ games }: { games: readonly GameSummary[] }) {
  return (
    <ul className="games">
      {games.map((game) => (
        <GameCard key={game.id} game={game} />
      ))}
    </ul>
  );
}
