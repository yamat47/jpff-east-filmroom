# Requirements

Agreed on 2026-11-14. This file is the source for what the site does and does not do. A change
of scope is a change to this file, in the same pull request as the code.

## 1. Purpose

An unofficial fan site that arranges the game videos on the J.P.F.F East YouTube channel by
season, team and game type, and lets a visitor move from one game to the next. On YouTube itself
a game is hard to find by opponent or by season.

| Item | Decision |
| --- | --- |
| Channel | [J.P.F.F East](https://youtube.com/@jpffeast), channel ID `UCgJ7OL5RIVnTI1MlRsy61ig` |
| Audience | Public: fans, players and staff of the teams, anyone |
| Standing | Unofficial fan site, not affiliated with JPFF |
| Videos | Embedded from YouTube only. Nothing is re-hosted or redistributed |
| Revenue | None. No advertising and no analytics |
| Language | Japanese only |
| Reference | Holodex, but only for "games are linked to each other and easy to follow" |
| Address | `jpff-east-filmroom` under the existing custom domain |
| Name | JPFF East Film Room (working name), always shown with 「非公式」 |

The channel carries official games, filmed for scouting, with no commentary or captions. The
site adds no commentary or editing either: it arranges the videos and links them.

## 2. Scope

The site arranges game videos by game, and nothing else. It holds no scores and nothing about
single plays.

In scope:

- Every game video on the channel, past ones included.
- Three tags per game: season, the two teams, game type.
- A game split over several videos is one game page with the videos in order.
- A YouTube live stream is listed from "scheduled" through "live" and stays as an archive.
- New videos are fetched automatically and arrive as a pull request with draft tags. A person
  corrects and merges it.
- A video that was deleted or made private is detected, and a pull request removes it.

Out of scope:

- Scores, venues, standings, block assignments.
- Tags on plays or timestamps.
- Videos that are not games (they go to the exclusion list when found).
- Linking a merged or joint team to the teams it came from.
- Favorites, multi-view, watch history, a page per matchup.
- Analytics, a contact form, login, comments.
- Downloading or re-uploading video files.
- A server or a database. The site is static.

## 3. Tags

There are three kinds of tag, season, game type and team, and each is attached to a game.

### Season

- A season runs from March 1 to the last day of February of the next year. Its label and its ID
  have the form `2026-2027`.
- It is derived from the game date in Japan time: March to December belong to "that year - next
  year", January and February to "previous year - that year".
- Spring league games and scrimmages go into the season their date falls in. Spring and autumn
  are not separate seasons.
- The season of a game can be overwritten by hand in the data, for exceptions such as a final
  that slips into March.

### Game type

| ID | Shown as | Covers |
| --- | --- | --- |
| `league` | リーグ戦 | Official regular season games, spring league included |
| `playoff` | プレーオフ | Playoffs, finals, bowl games, national tournaments (Ocean Bowl and the like) |
| `allstar` | オールスター | All-star and select games |
| `other` | その他 | Scrimmages and anything the three above do not cover |

### Team

- Each team that appears in a title is registered as one team.
- A merged team or a joint team is a team of its own, separate from the teams it came from. It
  is not shown on their pages.
- Different spellings of one team are registered as aliases of that team. 「WG＆ブロンコス合同」
  and 「ワイルドギース&東京ブロンコス」 are the same joint team.
- Whether a spelling is an alias or another team is decided by a person in pull request review.

The seed is the ten teams of the 2026-2027 season on the
[official site](https://jpffeast.jimdofree.com/): 立川ファルコンズ, 鎌倉ラザロ, 群馬スタリオンズ,
浦和ウラワーズ, 川崎グリズリーズ, 東海シーガルズ, ギースブロンコス合同チーム, ブランディングス,
甲府厚木タイタンズ, 所沢アウトローズ. Teams of earlier seasons come out of the titles in the
first full import.

## 4. Pages and URLs

Four kinds of page carry the site: top, game, team and season. Every page links to game pages.
The design is for a phone first.

| Page | URL | Content |
| --- | --- | --- |
| Top | `/` | Live and scheduled games at the top, only when there are any. Then every game, newest first, filtered by season, team and type |
| Game | `/games/{gameId}/` | Player, game date, season, type, links to both teams, three lists of related games |
| Team | `/teams/{teamId}/` | Every game of the team, grouped by season, newest first |
| Season | `/seasons/{seasonId}/` | Every game of the season, newest first, filtered by type |
| Teams | `/teams/` | Every team with its number of games |
| Seasons | `/seasons/` | Every season with its number of games |
| About | `/about/` | That the site is unofficial, where the videos come from, a link to the official channel |

### Game page

The centre of the site. After a video, the visitor goes straight on to the next game.

1. Heading: "A vs B" in the order of the title, game date, season, type.
2. Player: the YouTube embed. Split videos are stacked as Part 1, Part 2.
3. The original title of each video and a link "YouTubeで開く".
4. Earlier games of team A, newest first.
5. Earlier games of team B, newest first.
6. Games of the same season, newest first.

Lists 4 to 6 leave out the game on the page and show at most ten games each. The rest is
reached through "すべて見る" links to the team page and the season page.

### Rules for every page

- A game card shows the thumbnail, the game date, "A vs B", the type badge and the season. A
  split game shows the number of videos, a live stream its state.
- Thumbnails point at YouTube's thumbnail URLs. No image is copied.
- The player loads its iframe only after the thumbnail is pressed, to keep the first paint light.
- The filter state of the top page is in the URL query, for example
  `/?season=2026-2027&team=kamakura-lazaro&type=league`.
- `gameId` has the form `{date}-{teamA}-vs-{teamB}`, for example
  `2026-10-04-kamakura-lazaro-vs-tokai-seagulls`. It names the game, not a video, so a split
  game still has one URL.
- The footer of every page says the site is an unofficial fan site and links to the official
  channel.

## 5. Data model

All data lives in files in this repository. A game is the unit, and videos are its children,
which is what makes a split game natural.

| File | Role |
| --- | --- |
| `data/teams.yaml` | The teams and their aliases |
| `data/games/{seasonId}.json` | Games and their videos, one file per season so that a pull request diff stays readable |
| `data/excluded.json` | IDs of videos judged not to be games, with the reason, so that they do not come back in a pull request |

A team:

```yaml
- id: geese-broncos            # lower-case letters and hyphens, used in URLs
  name: ギースブロンコス合同チーム   # shown on the site
  aliases:                     # spellings found in titles, matched exactly after normalization
    - WG&ブロンコス合同
    - ワイルドギース&東京ブロンコス
```

A game and its videos:

```json
{
  "id": "2026-10-25-kofu-atsugi-titans-vs-geese-broncos",
  "date": "2026-10-25",
  "season": "2026-2027",
  "type": "league",
  "teams": ["kofu-atsugi-titans", "geese-broncos"],
  "needsReview": false,
  "videos": [
    {
      "videoId": "XXXXXXXXXXX",
      "part": 1,
      "title": "2026/10/25 甲府厚木タイタンズvsWG＆ブロンコス合同",
      "publishedAt": "2026-10-27T03:00:00Z",
      "durationSec": 1797,
      "live": null
    }
  ]
}
```

| Field | Meaning |
| --- | --- |
| `id` | `{date}-{teams[0]}-vs-{teams[1]}`. Never changed once published |
| `date` | Game date in Japan time. The date in the title wins |
| `season` | By default the value derived from `date`. Rewritten by hand only for an exception |
| `type` | `league` / `playoff` / `allstar` / `other` |
| `teams` | Two team IDs, in the order of the title |
| `needsReview` | `true` when the automatic judgement is unsure. Set to `false` by the person who checks it in the pull request |
| `videos[].part` | Order of split videos. `1` for a single video |
| `videos[].title` | The title on YouTube as written. Used to verify the parsing and shown on the page |
| `videos[].live` | `null` for an ordinary video. For a live stream `{ "status": "upcoming" \| "live" \| "archived", "scheduledStartTime": "..." }` |

Checked by CI on every change:

- Every ID in `teams` exists in `teams.yaml`.
- No `videoId` appears twice across all games and the exclusion list.
- No game `id` appears twice, and each equals the value built from `date` and `teams`.
- No alias is registered for more than one team.
- The season in a game file's name equals the `season` of every game in it.

View counts, descriptions, scores and venues are not stored.

## 6. Update flow

New videos are picked up automatically, and a person reviews and merges the pull request that
carries their draft tags. Nothing reaches the site without a person's check.

### Fetching new videos (GitHub Actions, once a day)

1. Get the channel's uploads with the YouTube Data API.
2. Compare with the known video IDs (games and exclusion list) and keep the unknown ones.
3. Get their details: title, publication time, length, live information.
4. Parse the title into a game date and two teams (section 7).
5. Estimate the game type and the rest with the Claude API (section 7).
6. If a game with the same date and the same two teams exists, add the video to it (a split
   game). Otherwise create a game.
7. Commit to a branch and open a pull request. If an import pull request is still open, update
   it.
8. When a person has checked, corrected and merged it, the build and the deployment run.

The pull request body has a table with, per video, the original title, the parse result, the
estimated type with its grounds, and whether it needs review. A video judged not to be a game is
in the same pull request as an addition to the exclusion list.

### Detecting removed videos (GitHub Actions, once a day)

1. Ask the YouTube Data API for every registered video ID.
2. Find the ones that are not returned or have become private.
3. Open a pull request that removes them. A game with no video left is removed whole.
4. When a person merges it, they disappear from the site.

### Changes that do not go through a pull request

For games already merged, only these mechanically determined values are committed to `main`
directly:

- The state of a live stream (scheduled, live, archived) and a change of its scheduled start.
- The length of the video, known once the stream has ended.

### The first full import

- The same script runs in a "full" mode from a local machine.
- One pull request per season, to keep each reviewable.
- The alias dictionary is made here: every spelling found in the titles is listed, the Claude
  API proposes, a person decides.

### By hand

- A data file can be edited and committed at any time.
- Both the import and the removal check can also be started from the Actions page.

## 7. Title parsing and LLM judgement

Rules extract the game date and the teams. Only what rules cannot decide goes to the Claude
API. Both results pass pull request review.

Titles seen so far (October 2026):

```
2026/10/25 甲府厚木タイタンズvsWG＆ブロンコス合同
2026/10/11 ワイルドギース&東京ブロンコス vs 所沢アウトローズ
2026/10/11 ブランディングス vs 甲府厚木タイタンズ
2026 10 4 川崎グリズリーズ vs 群馬スタリオンズ
2026 10 4 鎌倉ラザロ vs 東海シーガルズ
```

Three habits show: the date is separated by slashes or by spaces, `vs` has spaces around it or
not, and one team appears under different spellings.

### Rules

1. Normalize: Unicode NFKC turns full-width letters, digits and symbols into half-width ones,
   and runs of spaces become one.
2. Date: read "year month day" at the start. The separator may be `/`, a space, `-` or `.`, and
   month and day may have one digit or two.
3. Matchup: split the rest at `vs`, in any case, with or without spaces around it.
4. Teams: match each side exactly against the alias dictionary.
5. Split marker: words after the team name such as 「前半」「後半」「Part 2」「①」 become `part`.
6. Type keywords: 「プレーオフ」「決勝」「ボウル」「オールスター」「練習試合」 and the like in the
   title decide the type.

A video whose date, `vs` or team could not be read goes to the LLM judgement as needing review.
Older videos may be written differently, so the first import looks at the real data and adds
rules.

### What the Claude API decides

| Judgement | Input | Output |
| --- | --- | --- |
| Game type | Title, description, game date, both teams, whether it is a live stream, dates and types of the games already in the season | One of the four types, confidence, grounds |
| Unknown team spelling | The spelling, the teams and their aliases | Alias of an existing team, or a new team |
| Game or not | Title, description, length | Game or not, grounds |
| A title the rules could not parse | Title, publication time, teams | Game date and two teams |

- Descriptions are assumed to be nearly empty. A game with thin evidence for its type is set to
  `league` and gets `needsReview`.
- The output is a fixed JSON shape, validated against a schema. A broken shape means "needs
  review".
- The model is named by an environment variable, never in the code.
- A failing API call does not stop the import. The pull request is opened from the rule results
  alone and the game is marked as needing review.
- Nothing reaches the site on the LLM's judgement alone.

## 8. Live streams

A game streamed on YouTube Live gets its game page while it is scheduled, and the state moves on
to live and archived. Bowl games and a few others are expected.

| State | On the top page | On the game page |
| --- | --- | --- |
| `upcoming` | At the top, 「配信予定」 with the scheduled start | The embed (YouTube's waiting screen) and the scheduled start |
| `live` | At the top, with a 「配信中」 badge | The embed plays the stream |
| `archived` | In line with ordinary games | Like an ordinary game |

- State and scheduled start come from the video resource of the YouTube Data API
  (`snippet.liveBroadcastContent` and `liveStreamingDetails`). Check the field names against the
  API reference when implementing.
- The game date is the date in the title, or else the date of the scheduled start in Japan time.
- A new stream goes through a pull request like any other video. After the merge its state
  changes are applied automatically (section 6).
- A deleted stream is caught by the removal check.

The state is that of the last build, so with one import a day it lags. On the day of a stream
the page may still say "scheduled". Two things make up for it:

- The browser compares the current time with the scheduled start and shows a scheduled stream
  whose start has passed as 「配信中かも」.
- The player is YouTube's embed, so the stream itself plays correctly even when the page is
  stale.

## 9. Stack and layout

A static site written in TypeScript, published on GitHub Pages under a custom domain. No server
and no database.

| Area | Choice | Reason |
| --- | --- | --- |
| Site generation | Astro, static output | Most pages are lists and details built from data, with little interaction |
| Interactive parts | React, as Astro islands | Only the filter on the top page and the live state switch |
| Data validation | Zod | One schema shared by the site and the import scripts |
| Import scripts | Node.js and TypeScript | Same language and types as the site |
| Tests | Vitest | Title parsing and season derivation, verified on real titles |
| Automation | GitHub Actions | Import, removal check, validation, deployment |
| Hosting | GitHub Pages with a custom domain | The existing way of publishing |
| External APIs | YouTube Data API v3, Claude API | Video information, tag estimation |

```
.
├── data/
│   ├── teams.yaml
│   ├── excluded.json
│   └── games/
│       └── 2026-2027.json
├── src/
│   ├── pages/            index, games/[id], teams/[id], seasons/[id], about
│   ├── components/       GameCard, Player, FilterBar and so on
│   └── lib/              schema (Zod), season derivation, data loading
├── scripts/
│   ├── sync.ts           import of new videos (with a full mode)
│   ├── check-removed.ts  removal check
│   ├── parse-title.ts    title parsing
│   ├── classify.ts       Claude API calls
│   └── validate.ts       data validation
├── tests/
│   └── fixtures/titles.txt   real titles, collected over time
└── .github/workflows/
    ├── ci.yml            per pull request: validation, tests, build
    ├── deploy.yml        on push to main: build and publish
    ├── sync.yml          once a day, and by hand
    └── check-removed.yml once a day, and by hand
```

- Title parsing and season derivation are pure functions with no external API, fixed by tests.
- A few hundred games are expected, so the top page receives every game and filters in the
  browser. No search server.
- With JavaScript off, the lists and the links to game pages still work.
- No team logos or photographs. Text and YouTube thumbnails only.

## 10. Operations

Day to day there is one task: check the pull request that was opened and merge it. The running
cost is the domain and a small Claude API bill.

| Secret | Used for | Kept in |
| --- | --- | --- |
| `YOUTUBE_API_KEY` | Video information | GitHub Actions secrets, a local `.env` |
| `ANTHROPIC_API_KEY` | Tag estimation | The same |

`.env` is never committed. The repository is public, so no key may appear in code or logs.

The YouTube key: create a project in Google Cloud Console, enable "YouTube Data API v3", create
an API key under "Credentials", and restrict it to that API. Only public data is read, so no
OAuth is needed.

Quota, from the [official cost table](https://developers.google.com/youtube/v3/determine_quota_cost):
10,000 units a day by default, and `playlistItems.list` and `videos.list` cost one unit a call.
The import uses a few units a day and the removal check one unit per 50 videos. `search.list` is
limited to 100 calls a day and is not used. The Claude API is called only when there are new
videos, a few a week; only the first full import calls it in bulk.

When something fails:

- A failed import does not touch the published site. The next run retries.
- Failures are noticed through GitHub Actions notifications. No monitoring of its own.
- A pull request that fails data validation cannot be merged.
- GitHub disables scheduled workflows in a public repository after a long time without
  activity. What that means for the off-season is checked when the schedules are implemented.

On the site:

- The footer and the about page say it is an unofficial fan site with no relation to JPFF.
- They say the videos are embedded from the official channel and the rights belong to their
  holders.
- They link to the official channel and the official site.
- There is no contact form.

## 11. Acceptance and order of work

Done means: every game is listed, a visitor can move from game to game, and new videos arrive
as pull requests.

- Every game video of the channel is on some game page. No other video is.
- Every game page lists earlier games of team A, earlier games of team B and games of the same
  season, newest first, as links.
- The five titles in section 7 parse into the right date and teams (automated test).
- 「WG＆ブロンコス合同」 and 「ワイルドギース&東京ブロンコス」 resolve to the same team (automated
  test).
- Games on February 28 and March 1 fall into different seasons (automated test).
- Several videos of the same date and matchup appear on one game page in part order.
- A newly published video leads to a pull request on the next import, and merging it puts the
  game on the site.
- Reproducing a video that became private leads to a removal pull request.
- A scheduled live stream is at the top of the top page, and in line with the others once it
  has ended.
- At phone width the lists, the filter and playback work.

Order of work:

1. Repository skeleton, data schema, validation script, CI.
2. Title parsing and season derivation, with tests.
3. The fetch script and the first full import. The alias dictionary and the formats of old
   titles are settled here.
4. Pages: game, top, team, season.
5. Claude API judgement and the automated import pull request.
6. Live streams and the removal check.
7. Publication under the custom domain.

Step 3 can change the parsing rules, which is why real data comes before the pages.

## 12. Open

Each has a working assumption so that the work does not stop.

| Item | Working assumption | Decided |
| --- | --- | --- |
| Spelling of the site name | "JPFF East Film Room", after the subdomain | Before publication |
| Whether all-star and select teams get a team page | They do, like any other team | At the first import |
| Renamed teams | One team with aliases. Only merged and joint teams are separate teams | At the first import |
| Split markers in titles | 「前半」「後半」 and the like. No real example seen yet | At the first import |
| Number and format of old videos | Unknown. A few hundred, in the 2026 format | At the first import |
| Design direction | White, text first, phone first | When the pages are built |
| Connection to the existing GitHub Pages setup | Not worked out | Before publication |
| Claude API model | Named by an environment variable, chosen by accuracy and cost | When the LLM judgement is built |

## Sources

- [J.P.F.F East on YouTube](https://youtube.com/@jpffeast): the channel and its ID.
- [JPFF East official site](https://jpffeast.jimdofree.com/): the teams of the 2026-2027 season
  and which are merged or joint.
- [YouTube Data API quota costs](https://developers.google.com/youtube/v3/determine_quota_cost).
- The example titles are from the channel's video list as seen on 2026-11-14.
