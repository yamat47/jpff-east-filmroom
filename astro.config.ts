import react from "@astrojs/react";
import { defineConfig } from "astro/config";
import { SITE } from "./src/site.ts";

export default defineConfig({
  site: SITE.url,

  // Every URL in docs/requirements.md ends with a slash (/games/{gameId}/). GitHub Pages serves
  // a directory at that URL without a redirect, and links are written the same way.
  trailingSlash: "always",

  // React draws the game lists. Two things are sent to the browser as components: the list with
  // a filter, and the state of a live stream while the data has one that has not ended.
  // Everywhere else React is rendered to HTML at build time.
  integrations: [react()],
});
