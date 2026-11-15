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
| `data/excluded.json` | Videos judged not to be games, so that they do not come back |
| `src/lib/schema.ts` | The Zod schema of those files; the types are derived from it |
| `src/lib/` | Loading the data (`load-data.ts`), the rules that span files (`data-problems.ts`), game IDs, spelling normalization |
| `src/pages/`, `src/site.ts` | The routes, and the site's name, address and official links |
| `scripts/validate.ts` | Checks `data/` against the schema and against itself. CI runs it on every pull request |
| `tests/` | Vitest tests of the functions under `src/lib/` |
| `docker/`, `Makefile` | Development image and compose, and the entry point for development commands |

`docs/requirements.md` lists the files that are still to come (the import scripts, the pages).

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
| Build the site | `make build` (`dist/`) |
| Dev server | `make up` (http://localhost:4321) / `make logs` / `make down` |
| Add or update dependencies | `make pnpm ARGS="add -D <pkg>"` (the lockfile is also updated on the host) |
| First run, or after changing the Dockerfile | `make setup` |

## Rules that are easy to break

- **Videos are embedded, never copied.** No video file and no thumbnail enters the repository
  or the built site. Thumbnails are YouTube's URLs.
- **Nothing reaches the site without a person's check.** A new game, a new team, an alias and a
  removal arrive as a pull request that a person merges. An automatic judgement, by rule or by
  the Claude API, is a draft: when it is unsure it sets `needsReview` and never decides alone.
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
- **A URL ends with a slash.** `astro.config.ts` builds every page as a directory, so internal
  links are written `/games/{gameId}/`, never without the slash.
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
