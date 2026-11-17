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
| Name | JPFF East 試合検索. The name does not carry 「非公式」: the footer of every page and the about page say that the site is unofficial |

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
- A second upload of a game that is already shown: the same footage converted again, cut
  differently, or uploaded by mistake. One version is on the game page and the others go to the
  exclusion list, each naming the game. The site does not link to them.
- Linking a merged or joint team to the teams it came from.
- Favorites, multi-view, watch history, a page per matchup. The meetings of two teams are a team
  page narrowed to one opponent.
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
- The select teams of an all-star game are teams like any other, with a page of their own.
- Each team has two colours, the main one first. They are drawn as a small mark beside the
  team's name wherever the name stands, and nowhere without the name. A joint team has the main
  colour of each of its two teams. The colours are those of the uniform or the logo, read from
  the team's own site or given by a person who knows the team. They are near values and not an
  official specification.

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
| Top | `/` | Live and scheduled games at the top, only when there are any. Then the ways into the games: every team, every season, and the four newest games |
| Games | `/games/` | Every game, newest first, under a heading per season, filtered by team, season and type |
| Game | `/games/{gameId}/` | The two teams, game date, type, season, player, the other meetings of the two teams, the other games of the day, each team's games around this one |
| Team | `/teams/{teamId}/` | Every game of the team, grouped by season, newest first, filtered by opponent |
| Season | `/seasons/{seasonId}/` | Every game of the season, newest first, filtered by type |
| Teams | `/teams/` | Every team with its number of games, and the last season of a team that plays no more |
| Seasons | `/seasons/` | Every season with its number of games |
| About | `/about/` | That the site is unofficial, where the videos come from, a link to the official channel |

### Top page

The page a visitor opens first shows what the site can be searched by, and not a list of every
game. Its sections stand one under the other, each as wide as the page. While a stream is
scheduled or on air, 「ライブ配信」 stands above them (section 8).

1. Teams (「チームから探す」): every team that has a game, the teams of the newest season first,
   then the teams that play no more, each group in the order of `data/teams.yaml`. A team is of
   the newest season once it has a game in it, so at the start of a season a team stands among
   the others until its first game is on the site. On a desk
   they are a grid of tiles, each with the number of games and, for a team that plays no more,
   its last season (「22試合・2025-2026まで」, or 「のみ」 for a team of one season). On a phone they
   are one row of chips to swipe, with the names alone. The heading links to the page of teams.
2. Seasons (「シーズンから探す」): every season with its number of games, as links.
3. The newest games (「最新の試合」): the four newest that are not under 「ライブ配信」, with a
   link to the page of the newest season. On a desk they are cards on the columns of the team
   tiles; on a phone they are rows.

### Game page

The centre of the site. After a video, the visitor goes straight on to the next game.

1. Heading: "A vs B" in the order of the title, each name a link to that team's page. The
   names read as the title they are: no blue and no line under them, and a line under the
   name only where a pointer is over it. Under the heading, in one line of text, the game
   date, the type and the season, which links to the season page.
2. Player: the YouTube embed. Split videos are stacked, each under a heading "Part 1", "Part 2".
3. Under each player, a link "YouTubeで開く". The original title of a video is not shown.
4. The other games between the same two teams (「この対戦のほかの試合」), newest first. A row
   shows the date and the type, because the teams are those of the page.
5. The other games of the same day (「同じ日の試合」).
6. For each of the two teams, its games around this one: the two that follow it and the five
   before it, newest first, under a heading per season. The game on the page is in the list,
   marked 「この試合」, so that a visitor sees where it stands. A row names the opponent alone.
   The list stands under the team's name, with a link 「全N試合」 to the team page.

On a desk the two lists of 6 stand in a column beside the video; on a phone they follow 5.
Lists 4 and 5 leave out the game on the page, and a list with no game in it is left out, heading
and all.

### Team page

The team's games stand under a heading per season. A row names the opponent alone (「vs 相手」),
because every game on the page is this team's. The opponents are the filter of the page: each is
a button with the number of games against it, the opponent met most often first, and 「すべて」
opens the filter again. On a desk the buttons are a column beside the list; on a phone they are
one row to swipe.

### Rules for every page

- A game is a row of a list: the thumbnail, the date, the two teams as 「A vs B」 and the type
  as text. On a desk that is one line; on a phone the two teams stand one above the other
  beside the thumbnail. A row leaves out what its page has already said: the date among the
  other games of a day, one of the two teams on that team's page. No type has a colour or a
  badge of its own. A split game adds the number of videos, and a live stream that has not
  ended its state on a line of its own, under the teams.
- A date is written `2026/10/04` wherever it stands: with its year, without a weekday and
  without the words for year, month and day, so that the line under a game's title fits a
  phone. A season spans two years, so a row under a season heading keeps the year too.
- A team's name is written in full and is not broken in the middle. Where it does not fit in a
  line it breaks at the sign that joins two names (「&」「・」).
- Bold type is for headings and for what is selected. A name in a list is not bold.
- The navigation has three entries: every game, teams and seasons. The name of the site leads
  to the top page. The about page is linked from the footer.
- Thumbnails point at YouTube's thumbnail URLs. No image is copied.
- The player loads its iframe only after the thumbnail is pressed, to keep the first paint light.
  Until then it is a link to the video on YouTube, so it works without JavaScript. The iframe
  comes from `youtube-nocookie.com`.
- The state of a filter is in the URL query, for example
  `/games/?season=2026-2027&team=kamakura-lazaro&type=league` on the page of every game and
  `/teams/tachikawa-falcons/?team=kawasaki-grizzlies` on a team page narrowed to one opponent.
- A select of a filter has no label beside it. Until a value is chosen it shows its own name
  (「チーム」「シーズン」「種別」), and choosing that entry again opens the filter. A select that
  narrows the list has a heavier border.
- `gameId` is eight lower-case letters and digits, for example `k7m2x9qd`, short enough to
  pass on. `0`, `o`, `1`, `l` and `i` are not among them: they are read as one another. It
  names the game, not a video, so a split game still has one URL.
- A correction does not break a published URL. The ID is drawn by chance when the game enters
  the data and says nothing of the game, so correcting the date or the teams leaves it, and
  with it the URL of the game page, as it is. An ID is never changed and never given to
  another game. A game whose videos are all gone is removed (section 6), and its URL goes
  with it. When such a game comes back, because its video is public again or was uploaded
  again, the import drafts it with a new ID, as it cannot know the old one; the person who
  merges that draft puts back the ID the game had, so that the links to it work again.
- Until 2026-11-17 an ID spelled out the date and the teams
  (`2026-10-04-kamakura-lazaro-vs-tokai-seagulls`). Those URLs were public for one day and
  lead nowhere now: no page forwards them.
- A link to a page shows, where it is shared, the page's own title and description and a
  picture of 1200 by 630 that says what the page is of. The picture stands beside the page,
  at `{path of the page}og-image.png`:
  - a game page: its date and its two teams, each with the mark of its colours;
  - a team page: the team, with its mark;
  - a season page and each of the pages there is one of (every game, teams, seasons, about):
    the title of the page;
  - the top page: the mark and the name of the site. A page without a picture of its own, as
    the not-found page, shows this one.

  Every picture carries the name of the site and says that it is unofficial. The build draws
  them, so a new game has its picture when its pull request is merged, and it stops for a
  page with an address that is not in the list the pictures are drawn from. A name stays on
  one line inside the picture: it is written smaller the longer it is, down to a smallest
  size that 24 letters fit in. A longer name would reach into the margin and then over the
  edges. A test draws every picture of the site and fails on such a name, so a team cannot be
  registered with one before a person has decided what the picture does with it. A game page
  does not use the thumbnail of its video for this.
- The footer of every page says in one sentence that the site is an unofficial fan site and
  that the videos are those of the official channel. It links to the official channel, the
  official site and the about page.

## 5. Data model

All data lives in files in this repository. A game is the unit, and videos are its children,
which is what makes a split game natural.

| File | Role |
| --- | --- |
| `data/teams.yaml` | The teams, their two colours and their aliases |
| `data/games/{seasonId}.json` | Games and their videos, one file per season so that a pull request diff stays readable |
| `data/excluded.json` | IDs of videos that are in no game, with the reason (not a game, or a second upload of one), so that they do not come back in a pull request |

A team:

```yaml
- id: geese-broncos            # lower-case letters and hyphens, used in URLs
  name: ギースブロンコス合同チーム   # shown on the site
  colors: ["#2459c9", "#d4232b"] # the mark beside the name, main colour first (section 3)
  aliases:                     # spellings found in titles, matched exactly after normalization
    - WG&ブロンコス合同
    - ワイルドギース&東京ブロンコス
```

A title names a team by its `name` or by one of its `aliases`; the two together are the alias
dictionary of section 7.

A game and its videos:

```json
{
  "id": "k7m2x9qd",
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
| `id` | Eight lower-case letters and digits, without `0`, `o`, `1`, `l` and `i`, drawn by chance: by the import for a game it drafts, by `make game-id` for a game a person places by hand. It is the URL of the game page and never changes (section 4) |
| `date` | Game date in Japan time. The date in the title wins, unless the league's or a team's own record shows the title is wrong; such a date is set by hand |
| `season` | By default the value derived from `date`. Rewritten by hand only for an exception |
| `type` | `league` / `playoff` / `allstar` / `other` |
| `teams` | Two team IDs, in the order of the title |
| `needsReview` | `true` when the automatic judgement is unsure, or a person placing a game by hand leaves a decision open. A type of `league` by default does not set it (section 7). Set to `false` by the person who checks it in the pull request |
| `videos[].part` | Order of split videos. `1` for a single video |
| `videos[].durationSec` | Length in seconds. `null` for a live stream that has not ended, or whose length YouTube does not give yet. Only a live stream is without a length |
| `videos[].title` | The title on YouTube as written. Used to verify the parsing, and as the name a screen reader gives the player. Not shown on the page |
| `videos[].live` | `null` for an ordinary video. For a live stream `{ "status": "upcoming" \| "live" \| "archived", "scheduledStartTime": "..." }`. A stream that was started without a schedule has the time it began at |

Checked by CI on every change:

- Every ID in `teams` exists in `teams.yaml`.
- No `videoId` appears twice across all games and the exclusion list.
- No game `id` appears twice, and no two games have the same date and the same two teams: the
  videos of one game are its parts, and the import finds the game of a new video by these.
- No alias is registered for more than one team.
- The season in a game file's name equals the `season` of every game in it.

View counts, descriptions, scores and venues are not stored.

## 6. Update flow

New videos are picked up automatically, and a person reviews and merges the pull request that
carries their draft tags. Nothing reaches the site without a person's check, except the few
values named under "Changes that do not go through a pull request".

### Fetching new videos (GitHub Actions, once a day)

1. Get the channel's uploads with the YouTube Data API.
2. Compare with the known video IDs (games and exclusion list) and keep the unknown ones.
3. Get their details: title, publication time, length, live information.
4. Parse the title into a game date and two teams (section 7).
5. Estimate the game type and the rest with the Claude API (section 7).
6. If a game with the same date and the same two teams exists, add the video to it (a split
   game). Otherwise create a game, with a new ID.
7. Commit to a branch and open a pull request. If an import pull request is still open, update
   it.
8. When a person has checked, corrected and merged it, the build and the deployment run.

The pull request body has a table with, per video, the original title, the parse result, the
estimated type with its grounds, and whether it needs review. A video judged not to be a game is
in the same pull request as an addition to the exclusion list.

### Detecting removed videos (GitHub Actions, once a day)

1. Ask the YouTube Data API for every video of every game. The exclusion list is not asked: a
   video that is gone is not offered by the import either way.
2. Find the ones that are not returned. A video that was deleted and one that was made private
   look the same: an API key gets neither.
3. Open a pull request that removes them. A game with no video left is removed whole. A video
   that stays keeps its part number, so that a part uploaded again takes the place of the one
   that went.
4. When a person merges it, they disappear from the site.

An answer without a single video fails the check: that is a fault of the key or of the API, and
a draft that removes every game helps nobody.

### Changes that do not go through a pull request

For games already merged, only these mechanically determined values are committed to `main`
directly:

- The state of a live stream (scheduled, live, archived) and a change of its scheduled start.
- The length of the video, known once the stream has ended.

The refresh asks YouTube only for the streams the data does not have both the end and the
length of, and writes these values and nothing else. A stream that is put off to another day
keeps its game date, which is not YouTube's to decide: every run of the refresh names the
stream and its day until a person has corrected the game. A stream YouTube no longer returns is
left to the removal check.

### The first full import

- The same script runs from a local machine. It looks at every upload on every run, and
  `--season` limits which season's file it writes.
- One pull request per season, to keep each reviewable.
- The alias dictionary is made here: every spelling found in the titles is listed, and a
  person decides which team each names. The first import did this without the Claude API.

### By hand

- A data file can be edited and committed at any time.
- Both the import and the removal check can also be started from the Actions page.
- `make sync`, `make check-removed` and `make refresh-live` run the import, the removal check
  and the refresh of the live streams from a local machine. Each writes the season files and
  prints what it did; the first two print it as the body of a pull request.

## 7. Title parsing and LLM judgement

Rules extract the game date and the teams. Only what rules cannot decide goes to the Claude
API. Both results pass pull request review.

Titles seen so far (October 2026):

```
2026/10/25 甲府厚木タイタンズvsWG＆ブロンコス合同
2026/10/11 ワイルドギース&東京ブロンコスvs所沢アウトローズ
2026/10/11 ブランディングスvs甲府厚木タイタンズ
2026 10 4 川崎グリズリーズvs群馬スタリオンズ
2026 10 4 鎌倉ラザロvs東海シーガルズ
```

Three habits show: the date is separated by slashes or by spaces, `vs` has spaces around it or
not, and one team appears under different spellings.

The channel's video list on 2026-11-15 showed more in the titles of 2025. The five titles above
are written here as that list has them; `vs` with spaces around it is in
`20251102 横浜甲府合同チーム vs ブランディングス`, which also writes its date as eight digits.
Playoff titles name the occasion first (`2025/12/07 プレーオフ 東海シーガルズvsワイルドギース`),
one kind with a year and no date (`2025準決勝　川崎グリズリーズvs浦和ウラワーズ`). A title without
a full date is read as having no date. The titles of that list are in
`tests/fixtures/titles.txt`.

### Rules

1. Normalize: Unicode NFKC turns full-width letters, digits and symbols into half-width ones,
   and runs of spaces become one.
2. Date: read "year month day" at the start. The separator may be `/`, a space, `-` or `.`, and
   month and day may have one digit or two. Eight digits with no separator (`20251102`) are a
   date too.
3. Matchup: split the rest at `vs`, in any case, with or without spaces around it.
4. Label: what stands between the date and the first team is not part of its name when it is
   the game's number on that day (`-1`, ` 2`, `①`, `2HD`), the round (`第4節`,
   `第13節第2試合`), the half the video covers (`前半`, `【後半】`), or a lone `-` or `_`.
5. Teams: match each side exactly against the alias dictionary. Words before the first team
   that name the occasion, as in 「プレーオフ 東海シーガルズ」 or 「2025準決勝 川崎グリズリーズ」,
   are not part of its name.
6. Split marker: words after the team name such as 「前半」「後半」「Part 2」「①」 become `part`.
   A number counts as a part only from 1 to 99, so a year at the end is not one. A quarter
   (`1Q` to `4Q`, before everything else or after the teams, also as `前半2Q`) is the part.
7. Type keywords: 「プレーオフ」「決勝」「ボウル」「オールスター」「練習試合」 and the like in the
   title decide the type.

The league's own result pages are the authority for the type: a game they list under a round
(第N節) is `league`, and one under プレーオフ, 準決勝 or ハーバーボウル is `playoff`. The first import
was checked against them game by game.

A title without a type keyword is drafted as `league`. Until the Claude API judgement exists
(step 5) such a game is not marked `needsReview` on that ground alone: nearly every game would
be, and the mark would no longer single out the games with something to decide.

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
| `upcoming` | At the top, under 「ライブ配信」, with the scheduled start as 「13:00 配信予定」 | The embed (YouTube's waiting screen), and the scheduled start under the game date |
| `live` | At the top, under 「ライブ配信」, with 「配信中」 in red | The embed plays the stream, and 「配信中」 stands under the game date |
| `archived` | Not there: it is a game like any other, among the newest games while it is one of them | Like an ordinary game |

- State and scheduled start come from the video resource of the YouTube Data API
  (`snippet.liveBroadcastContent` and `liveStreamingDetails`). Check the field names against the
  API reference when implementing.
- The game date is the date in the title, or else the date of the scheduled start in Japan time.
  A game dated by its stream is drafted with `needsReview`: YouTube reports a video released
  as a premiere like a stream, and the day of a release is not the day of a game.
- A new stream goes through a pull request like any other video. After the merge its state
  changes are applied automatically (section 6).
- A deleted stream is caught by the removal check.
- YouTube gives the length of a stream some time after its end. Until then the length is
  unknown, and the stream is still asked for.

The state is that of the last build, so with one import a day it lags. On the day of a stream
the data may still say "scheduled". The browser makes up for it by the clock alone, and shows
the first of these that holds:

1. The data says `archived`: an ordinary game.
2. Four hours or more have passed since the scheduled start: an ordinary game.
3. The data says `live`, or the scheduled start has passed: 「配信中」.
4. Otherwise: 「配信予定」 with the scheduled start.

A stream that starts late, or is put off on the day, is shown as live from the start the data
has, and one that runs longer than four hours as an ordinary game before it ends. All of these
are accepted, because the rule reads nothing but the clock. Without JavaScript a page shows the
state of the last build. The API also reports a scheduled end
(`liveStreamingDetails.scheduledEndTime`), which the site neither stores nor uses.

The clock is read where the state matters: under 「ライブ配信」 and 「最新の試合」 of the top page,
which a stream moves between, under the date of its game page, and in the lists that have a
filter. The other lists of a game page, the games around it included, show the state of the
last build. A page is sent the
script for this only while the data has a stream that has not ended: on every other day the top
page and the game pages are plain HTML.

The player is YouTube's embed, so the stream itself plays correctly even when the page is
stale.

## 9. Stack and layout

A static site written in TypeScript, published on GitHub Pages under a custom domain. No server
and no database.

| Area | Choice | Reason |
| --- | --- | --- |
| Site generation | Astro, static output | Most pages are lists and details built from data, with little interaction |
| Interactive parts | React, as Astro islands | Only the filter of a list of games (the page of every game, a season page, a team page) and the live state switch |
| Data validation | Zod | One schema shared by the site and the import scripts |
| Pictures of a shared link | satori and resvg, with Noto Sans JP from a package | Drawn at build time from the data, so a new game needs no picture made by hand. The font is used by the build alone and is not served |
| Import scripts | Node.js and TypeScript | Same language and types as the site |
| Tests | Vitest | Title parsing and season derivation, verified on real titles |
| Automation | GitHub Actions | Import, removal check, validation, deployment |
| Hosting | GitHub Pages with a custom domain | The author's other sites are published the same way |
| External APIs | YouTube Data API v3, Claude API | Video information, tag estimation |

```
.
├── data/
│   ├── teams.yaml
│   ├── excluded.json
│   └── games/
│       └── 2026-2027.json
├── src/
│   ├── pages/            index, games/ and games/[id], teams/ and teams/[id], seasons/ and seasons/[id], about,
│   │                     [...page]/og-image.png (the picture of a shared link, beside every page)
│   ├── components/       GameRow, GameList, TeamLabel, TeamTimeline, FilteredGames, LiveState, TopGames, Player, ExternalMark
│   └── lib/              schema (Zod), game IDs, season derivation, the state of a live stream, data loading,
│                         which page has which picture of a shared link, and the drawing of them
├── scripts/
│   ├── sync.ts           import of new videos (--season writes one season only)
│   ├── check-removed.ts  removal check
│   ├── refresh-live.ts   state and length of the live streams
│   ├── parse-title.ts    title parsing
│   ├── youtube.ts        YouTube Data API calls
│   ├── draft-games.ts    placing new videos into games by rule
│   ├── removed-videos.ts taking the videos YouTube no longer returns out of the games
│   ├── live-state.ts     what the refresh changes of a stream
│   ├── season-files.ts   writing the season files
│   ├── new-game-id.ts    an unused ID for a game placed by hand
│   ├── classify.ts       Claude API calls
│   └── validate.ts       data validation
├── tests/
│   └── fixtures/titles.txt   real titles, collected over time
└── .github/workflows/
    ├── ci.yml            per pull request: validation, tests, build
    ├── deploy.yml        on push to main: build and publish
    ├── sync.yml          once a day, and by hand
    ├── check-removed.yml once a day, and by hand
    ├── refresh-live.yml  the live streams; how often is decided with the workflow
    └── update-skills.yml once a month: the agent skills under .claude/skills/
```

- `deploy.yml` checks the types and the data again before it builds the site and hands it to
  GitHub Pages. The Pages site and its custom domain are declared in yamat47/infra-github and
  the DNS record in yamat47/infra-yamat47, not in this repository.
- Title parsing and season derivation are pure functions with no external API, fixed by tests.
- A few hundred games are expected, so the page of every game receives them all and filters in
  the browser. No search server.
- With JavaScript off, the lists and the links to game pages still work.
- No team logos or photographs. Text, the mark of a team's two colours and YouTube thumbnails
  only. The site has a mark of its own, a football in the black and white of the pages, and
  uses it as its favicon and on the pictures of a shared link, and nowhere on a page. It is
  not the league's logo.
- The look: white, black and grey, text first, phone first. Two colours carry meaning, the blue
  of a link and the red of a live stream. The only other colour is the mark of a team's two
  colours beside its name, which is data and not a design value. System fonts only, so that no
  font is requested from another site. A list of games is rows with a small thumbnail, one
  line to a row on a wide screen; the matchup on a game page is the largest text on the site.
  Every design value is in `src/styles/tokens.css`. The favicon alone repeats two of them,
  the black of the text and the white of the page, because a file served on its own cannot
  read a variable. The pictures of a shared link take their colours, weights and line height
  from that file when they are drawn. Their measures are their own, as nothing else on the
  site is 1200 by 630, and so is their grey: a picture is the page turned over, white on
  black, and its grey is the white let through in part. They are also the one place with a font that is not the system's: the
  build draws their letters with Noto Sans JP, which it installs as a package, because the
  machine that builds the site has no Japanese font. The font is not served: only the drawn
  letters are in the pictures.

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
videos, a few a week. The first full import ran without it.

When something fails:

- A failed import does not touch the published site. The next run retries.
- Failures are noticed through GitHub Actions notifications. No monitoring of its own.
- A pull request that fails data validation cannot be merged.
- GitHub disables scheduled workflows in a public repository after a long time without
  activity. What that means for the off-season is checked when the schedules are implemented.

On the site:

- The footer of every page and the about page say it is an unofficial fan site. The name of
  the site does not say it.
- The about page says that the site has no relation to JPFF, that the videos are embedded from
  the official channel and that the rights belong to their holders.
- Both link to the official channel and the official site.
- There is no contact form.

## 11. Acceptance and order of work

Done means: every game is listed, a visitor can move from game to game, and new videos arrive
as pull requests.

- Every game of the channel's videos has a game page, and a second upload of a game is the
  only game video that is on none. No other video is on a page.
- Every game page lists, as links, the other games between its two teams, the other games of
  its day, and each team's games around it, newest first.
- From the top page a visitor reaches every team and every season, and from there every game.
- The five titles in section 7 parse into the right date and teams (automated test).
- 「WG＆ブロンコス合同」 and 「ワイルドギース&東京ブロンコス」 resolve to the same team (automated
  test).
- Games on February 28 and March 1 fall into different seasons (automated test).
- Several videos of the same date and matchup appear on one game page in part order.
- A newly published video leads to a pull request on the next import, and merging it puts the
  game on the site.
- Reproducing a video that became private leads to a removal pull request.
- A scheduled live stream is at the top of the top page, and a game like any other once it has
  ended.
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

Step 7 was done before steps 5 and 6, because the site is of use as soon as its pages are.

Step 6 is built except for its schedules. The pages show a live stream, the import places one
in a game, and `make check-removed` and `make refresh-live` do what the two daily runs will do.
The workflows that run them, and the import, once a day wait for the identity they act as
(section 12). Until then the three commands are run by hand, and what they write reaches
`main` through a pull request like any other change.

## 12. Open

Each has a working assumption so that the work does not stop.

| Item | Working assumption | Decided |
| --- | --- | --- |
| Renamed teams | One team with aliases. Only merged and joint teams are separate teams | When a renamed team first appears; the first import met none |
| Short aliases whose team depends on the year | Accepted, and left to pull request review. 「WG」「ギース」「東京」「ブロンコス」 name ワイルドギース and 東京ブロンコス, which play as one joint team from 2026-2027, and 「群馬」 names 群馬スタリオンズ, which played as a joint team in 2021-2022. The dictionary has no season, so a new title with such a name is drafted as the old team without a flag | When a title does it |
| Which identity the scheduled workflows act as | Not decided. With `github.token` a push to `main` is refused by the repository's ruleset, which also asks for signed commits, and a pull request it opens starts neither CI nor a deployment. A GitHub App token for the pull requests is the likely answer; how the live state reaches `main` is decided with it | Before the first scheduled workflow: the import, the removal check or the refresh of the live streams |
| Whether a game with `needsReview: true` may be merged | Not decided. CI does not look at the flag yet, and the pages show a flagged game like any other. No game carried the flag at publication, and until this is decided a flag is cleared before its pull request is merged | Before step 5 |
| Claude API model | Named by an environment variable, chosen by accuracy and cost | When the LLM judgement is built |

## Sources

- [J.P.F.F East on YouTube](https://youtube.com/@jpffeast): the channel and its ID.
- [JPFF East official site](https://jpffeast.jimdofree.com/): the teams of the 2026-2027 season
  and which are merged or joint.
- [JPFF East results of past seasons](https://jpffeast.jimdofree.com/過去のresult/), and the
  result pages of [2023-2024](https://jpffeast.jimdofree.com/2023-2024-seasonresult/),
  [2024-2025](https://jpffeast.jimdofree.com/2024-2025-seasonresult/) and
  [2025-2026](https://jpffeast.jimdofree.com/2025-2026-seasonresult/): every game by round, which
  decides league or playoff. Most give no dates.
- [JPFF East news](https://jpffeast.jimdofree.com/news/): the dates of the 2024 playoffs and of
  the 2018 all-star game.
- [東海シーガルズ, 試合](https://tokaiseagulls.com/試合/): the team's own record with the date of
  each of its games.
- [YouTube Data API quota costs](https://developers.google.com/youtube/v3/determine_quota_cost).
- The example titles are from the channel's video list as seen on 2026-11-14.
