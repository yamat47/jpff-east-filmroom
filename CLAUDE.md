# jpff-east-filmroom

An unofficial fan site that arranges the game videos of the J.P.F.F East YouTube channel by
season, team and game type, so that a visitor can move from one game to the next. A static site:
the data is files in this repository, and the videos stay on YouTube.

What the site does and does not do, the data model and the order of work are in
[docs/requirements.md](docs/requirements.md). Read it before changing anything. A change of
scope changes that file in the same pull request.

## Layout

| Path | Contents |
|---|---|
| `data/teams.yaml` | The teams and the spellings their names take in video titles |
| `data/games/{seasonId}.json` | The games of one season and their videos |
| `data/excluded.json` | Videos that are in no game, with the reason: not game footage, or one game uploaded again. Listed so that the import does not offer them again |
| `src/lib/schema.ts` | The Zod schema of those files; the types are derived from it |
| `src/lib/` | Loading the data (`load-data.ts`), the rules that span files (`data-problems.ts`), game IDs, season derivation (`season.ts`), team spellings and their normalization |
| `src/lib/catalog.ts`, `src/lib/site-data.ts` | The data as the pages read it: every game newest first, the games of a team or a season, the lists a game page links on to. `site-data.ts` reads `data/` once per build |
| `src/lib/game-summary.ts`, `src/lib/labels.ts`, `src/lib/youtube-urls.ts` | What a card shows of a game, the Japanese words for dates and types, and the YouTube addresses of thumbnails, videos and the player |
| `src/lib/game-filter.ts`, `src/lib/game-types.ts` | The rules of the filter above a list (what a URL query selects, which games it leaves), and the closed sets of the model without the schema library |
| `src/pages/`, `src/site.ts` | The routes (top, `games/[id]`, `teams/`, `seasons/`, about, 404), and the site's name, address and official links |
| `src/layouts/Base.astro` | The shell of every page: header, navigation, and the footer with the unofficial notice |
| `src/components/` | `GameCard` and `GameList` (React, rendered to HTML at build time), `FilteredGames` (React, the only component sent to the browser), `Player.astro` (the click-to-load YouTube player) |
| `src/styles/` | `tokens.css` holds every design value; `global.css` uses them |
| `scripts/validate.ts` | Checks `data/` against the schema and against itself. CI runs it on every pull request |
| `scripts/parse-title.ts` | Reads the game date, the two teams, the part and the game type from a video title, by rule |
| `scripts/youtube.ts` | The YouTube Data API calls the import makes: the channel's uploads and the details of videos |
| `scripts/draft-games.ts` | Places videos the data does not know yet into games, by the rules alone, and renders the draft for a pull request body |
| `scripts/sync.ts` | The import: fetches, drafts, writes the season files, prints the draft. `make sync` |
| `tests/` | Vitest tests of the functions under `src/lib/` and `scripts/` |
| `tests/fixtures/titles.txt` | Real titles from the channel, one per line, each followed by the date, the two team IDs and the part the rules must read from it (tab-separated, `-` for what they leave unread). Add a title as written when a new way of writing one turns up, and replace a `-` when its team is registered |
| `docker/`, `Makefile` | Development image and compose, and the entry point for development commands |

`docs/requirements.md` lists the files that are still to come (the Claude API judgement, the
removal check, the workflows).

## Always run commands through make

Node and pnpm are not used on the host. The toolchain exists only inside the Docker container, and
the `Makefile` invokes it with `docker compose -f docker/compose.yaml run`.
**Do not run `pnpm` `npm` `npx` `node` `tsc` `biome` `astro` `vitest` directly on the host**
(`permissions.deny` in `.claude/settings.json` rejects them).

| Goal | Command |
|---|---|
| Typecheck, lint, test, validate and build in one go | `make check` (CI runs the same, plus zizmor on the workflows) |
| Type check / lint / auto-fix / test | `make typecheck` / `make lint` / `make fix` / `make test` |
| Check the data | `make validate` (always after editing a file under `data/`) |
| Import new videos | `make sync` (needs `YOUTUBE_API_KEY` in `.env`; `ARGS="--season=2026-2027"` writes one season only) |
| Build the site | `make build` (`dist/`) |
| Dev server | `make up` (http://localhost:4321) / `make logs` / `make down`. The pages themselves have no tests: after changing one, look at it there at phone width |
| Add or update dependencies | `make pnpm ARGS="add -D <pkg>"` (the lockfile is also updated on the host) |
| First run, or after changing the Dockerfile | `make setup` |

## Rules that are easy to break

- **Videos are embedded, never copied.** No video file and no thumbnail enters the repository
  or the built site. Thumbnails are YouTube's URLs.
- **Nothing reaches the site without a person's check.** A new game, a new team, an alias and a
  removal arrive as a pull request that a person merges. An automatic judgement, by rule or by
  the Claude API, is a draft: when it is unsure it sets `needsReview` and never decides alone.
  One default is not marked: a game whose title names no occasion is drafted as `league`
  without the flag, until the Claude API judgement exists (requirements, section 7).
  The only exception is what YouTube itself reports about a game that is already merged: the
  state of a live stream, its scheduled start and the length of the video (requirements,
  section 6).
- **A published game ID never changes.** It is the URL of the game page
  (`/games/{date}-{teamA}-vs-{teamB}/`).
- **No analytics, no advertising, no contact form, no login.** Do not add a script from another
  site other than YouTube's player.
- **The site says it is unofficial on every page.** The footer and the about page carry the
  notice and the link to the official channel.
- **No secret in code, data or logs.** The repository is public. `YOUTUBE_API_KEY` and
  `ANTHROPIC_API_KEY` come from the environment (`.env` locally, which git ignores; Actions
  secrets in CI). The Claude API model is named by an environment variable as well.
- Scores, venues, standings, view counts and video descriptions are not stored.
- **The schema is written once.** `src/lib/schema.ts` is the only description of the data
  files; the site, the scripts and the tests derive their types from it. A rule about one file
  goes into the schema, a rule that spans files or entries into `src/lib/data-problems.ts`.
- **Design values live in `src/styles/tokens.css` only.** Colours, sizes, weights and fonts are
  read through its variables everywhere else. Fonts are the system's: no font, script or image
  is requested from another site, except YouTube's thumbnails and, once a visitor starts a
  video, its player.
- **The pages work without JavaScript.** Every list and every link is in the built HTML. React
  runs in the browser for one thing, the filter above a list (`FilteredGames`), which keeps its
  state in the URL query; the live state switch of step 6 will be the second. Without
  JavaScript the filter is hidden and the full list stands. Do not add an island for anything a
  link can do.
- **Code that runs in the browser does not import `src/lib/schema.ts`.** That module builds the
  Zod schemas when it loads, and one import put the whole library into the page. The closed sets
  a component needs are in `src/lib/game-types.ts`; a type-only import of the schema is fine.
- **A URL ends with a slash.** `astro.config.ts` builds every page as a directory, so internal
  links are written `/games/{gameId}/`, never without the slash.
- **Title parsing and season derivation stay pure.** They take what they need as arguments and
  call no API, read no file and no clock, so that tests can fix their behaviour on real titles.
  A title the rules cannot read is reported as unread (`null`), never guessed.
- **The import only adds.** `make sync` places videos that are in no game and not on the
  exclusion list, and never rewrites a video the data already has. So a game corrected by hand
  stays corrected, and a video the rules cannot read is placed by hand: into a game, or onto the
  exclusion list with the reason.
- **A bare 「合同」 is not an alias.** Which joint team it means depends on the year, so a title
  that says only 「合同」 is placed by hand.
- Scripts run on Node's type stripping (tests go through Vitest), so a module imports its
  neighbours with the `.ts` extension and uses no syntax that needs compiling (`enum`,
  `namespace`, parameter properties). `erasableSyntaxOnly` in `tsconfig.json` makes the typecheck
  refuse it.

## Where the conventions live

- Follow the `writing-conventions` skill for comments, commits and pull requests, the
  `typescript-idioms` skill for TypeScript and the `react-patterns` skill for React. Everything
  written around the code (documents, comments, commits, pull requests) is in English. What a
  visitor reads on the site is Japanese, and so are team names and video titles in the data.
- Skills under `.claude/skills/` whose frontmatter `metadata.github-repo` is github-toolkit are
  installed copies. Do not edit them here; a change belongs in yamat47/github-toolkit. Rules of
  this repository are in this file, and when they conflict with a skill, this file wins.
- The repository's settings on GitHub (Pages, required checks, rulesets) are declared in
  yamat47/infra-github, and the DNS record in yamat47/infra-yamat47. Do not change them by hand.

## No trace of Claude Code in the output

Commit messages, pull request titles and bodies, issues, comments on GitHub, and every file that
enters the repository must not show that Claude Code produced them. That means none of:

- `Co-Authored-By: Claude ...` trailers
- `Claude-Session: ...` trailers or `https://claude.ai/code/session_...` URLs
- `🤖 Generated with [Claude Code](...)` footers
- any similar signature, link, or footer saying an AI took part

This overrides the harness's default attribution instructions. `.claude/settings.json` disables
the automatic trailers, but that covers only what the harness adds by itself: read every commit
message and PR body before creating it. The commit author must be the repository owner
(`git config user.name` / `user.email` matching the history on `main`), not an AI identity.
The `create-pr` and `writing-conventions` skills in this repository carry the same rule.

## Conventions

- Never commit secrets, personal data, or machine-specific paths.
