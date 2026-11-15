import { defineConfig } from "astro/config";
import { SITE } from "./src/site.ts";

export default defineConfig({
  site: SITE.url,

  // Every URL in docs/requirements.md ends with a slash (/games/{gameId}/). GitHub Pages serves
  // a directory at that URL without a redirect, and links are written the same way.
  trailingSlash: "always",
});
