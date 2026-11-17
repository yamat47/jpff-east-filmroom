import type { APIRoute, InferGetStaticPropsType } from "astro";
import { summarize } from "../../../lib/game-summary.ts";
import { gameCard, shareImageResponse } from "../../../lib/share-image.tsx";
import { catalog, gamePaths } from "../../../lib/site-data.ts";

export const getStaticPaths = gamePaths;

/** The picture a link to the game's page shows where it is shared: its date and its teams. */
export const GET: APIRoute<InferGetStaticPropsType<typeof getStaticPaths>> = ({ props }) =>
  shareImageResponse(gameCard(summarize(catalog, props.game)));
