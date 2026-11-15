# jpff-east-filmroom

An unofficial fan site that arranges the game videos of the J.P.F.F East YouTube channel by
season, team and game type, so that a visitor can move from one game to the next. A static site:
the data is files in this repository, and the videos stay on YouTube.

What the site does and does not do, the data model and the order of work are in
[docs/requirements.md](docs/requirements.md). Read it before changing anything. A change of
scope changes that file in the same pull request.

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

## Where the conventions live

- Follow the `writing-conventions` skill for comments, commits and pull requests. Everything
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
