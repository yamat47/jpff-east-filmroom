import type { APIRoute, InferGetStaticPropsType } from "astro";
import { shareImageResponse } from "../../lib/share-image.tsx";
import { shareCards } from "../../lib/site-data.ts";

// The picture a link to a page shows where it is shared, beside the page: /og-image.png for the
// top page, /games/{gameId}/og-image.png for a game. The name of this file is the one in
// `SITE.shareImage.file`, by which the page shell names the picture.
export function getStaticPaths() {
  return [...shareCards].map(([path, card]) => ({
    // "/games/k7m2x9qd/" is the page "games/k7m2x9qd". The top page has no name.
    params: { page: path.slice(1, -1) || undefined },
    props: { card },
  }));
}

export const GET: APIRoute<InferGetStaticPropsType<typeof getStaticPaths>> = ({ props }) =>
  shareImageResponse(props.card);
