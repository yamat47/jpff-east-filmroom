import { gameIdOf } from "./game-id.ts";
import type { SiteData } from "./schema.ts";
import { spellingsOf } from "./team-spellings.ts";

/**
 * What the files under data/ get wrong when read together. Each file already fits its schema;
 * these are the rules that span files or entries. An empty result means the data is consistent.
 */
export function findDataProblems(data: SiteData): string[] {
  return [...teamProblems(data), ...gameProblems(data), ...videoProblems(data)];
}

function teamProblems({ teams }: SiteData): string[] {
  const problems: string[] = [];
  const seenIds = new Set<string>();
  const ownerOfSpelling = new Map<string, string>();

  for (const team of teams) {
    if (seenIds.has(team.id))
      problems.push(`team ${team.id}: the ID is used by more than one team`);
    seenIds.add(team.id);

    // The name is matched in titles like an alias, so it must be unambiguous in the same way.
    for (const spelling of spellingsOf(team)) {
      const owner = ownerOfSpelling.get(spelling);
      if (owner !== undefined && owner !== team.id) {
        problems.push(`team ${team.id}: "${spelling}" already names team ${owner}`);
      }
      ownerOfSpelling.set(spelling, owner ?? team.id);
    }
  }
  return problems;
}

function gameProblems({ teams, seasons }: SiteData): string[] {
  const problems: string[] = [];
  const teamIds = new Set(teams.map((team) => team.id));
  const seenIds = new Set<string>();

  for (const { season, games } of seasons) {
    for (const game of games) {
      if (seenIds.has(game.id))
        problems.push(`game ${game.id}: the ID is used by more than one game`);
      seenIds.add(game.id);

      const expectedId = gameIdOf(game);
      if (game.id !== expectedId) {
        problems.push(`game ${game.id}: its date and teams make the ID ${expectedId}`);
      }
      if (game.season !== season) {
        problems.push(`game ${game.id}: season ${game.season} is in the file of ${season}`);
      }
      for (const teamId of game.teams) {
        if (!teamIds.has(teamId))
          problems.push(`game ${game.id}: team ${teamId} is not in teams.yaml`);
      }
      if (game.teams[0] === game.teams[1]) {
        problems.push(`game ${game.id}: both sides are team ${game.teams[0]}`);
      }

      const parts = game.videos.map((video) => video.part);
      if (new Set(parts).size !== parts.length) {
        problems.push(`game ${game.id}: two videos have the same part number`);
      } else if (parts.some((part, index) => part < (parts[index - 1] ?? 0))) {
        // The pages show the videos in the order of the file and take the first for the card.
        problems.push(`game ${game.id}: its videos are not in the order of their part numbers`);
      }
    }
  }
  return problems;
}

function videoProblems({ seasons, excluded }: SiteData): string[] {
  const problems: string[] = [];
  const whereSeen = new Map<string, string>();

  const places = [
    ...seasons.flatMap(({ games }) =>
      games.flatMap((game) =>
        game.videos.map((video) => [video.videoId, `game ${game.id}`] as const),
      ),
    ),
    ...excluded.map((video) => [video.videoId, "the exclusion list"] as const),
  ];

  for (const [videoId, place] of places) {
    const earlier = whereSeen.get(videoId);
    if (earlier !== undefined) {
      problems.push(`video ${videoId}: listed in ${earlier} and again in ${place}`);
    }
    whereSeen.set(videoId, earlier ?? place);
  }
  return problems;
}
