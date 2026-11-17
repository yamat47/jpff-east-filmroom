import type { APIRoute } from "astro";
import { shareImageResponse, siteCard } from "../lib/share-image.tsx";

/** The picture a link to any page but a game's shows where it is shared. */
export const GET: APIRoute = () => shareImageResponse(siteCard());
