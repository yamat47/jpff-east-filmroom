/** What every page says about the site, and where it sends a visitor for the official sources. */
export const SITE = {
  // The name does not say that the site is unofficial. The footer of every page and the about
  // page say it.
  name: "JPFF East 試合検索",
  url: "https://jpff-east-filmroom.yamat47.me",
  description:
    "J.P.F.F East の YouTube チャンネルにある試合動画を、シーズン・チーム・試合種別で整理した非公式のファンサイトです。",
  lang: "ja",
  // What the pictures of a shared link say of the site, under its name.
  unofficialNote: "非公式ファンサイト",
  // The picture a link to a page shows where it is shared, unless the page has one of its own
  // as a game page does (src/pages/og-image.png.ts), and the size every such picture has: the
  // one the services that show a shared link ask for.
  shareImage: { path: "/og-image.png", width: 1200, height: 630 },
  channelUrl: "https://youtube.com/@jpffeast",
  channelId: "UCgJ7OL5RIVnTI1MlRsy61ig",
  officialSiteUrl: "https://jpffeast.jimdofree.com/",
} as const;
