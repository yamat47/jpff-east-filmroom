/** What every page says about the site, and where it sends a visitor for the official sources. */
export const SITE = {
  name: "JPFF East Film Room",
  // The name is never shown without the mark. The header shows `name` beside the mark as an
  // element of its own; everywhere else a page shows this, or says 非公式 in the same sentence.
  nameWithMark: "JPFF East Film Room(非公式)",
  url: "https://jpff-east-filmroom.yamat47.me",
  description:
    "J.P.F.F East の YouTube チャンネルにある試合動画を、シーズン・チーム・試合種別で整理した非公式のファンサイトです。",
  lang: "ja",
  channelUrl: "https://youtube.com/@jpffeast",
  channelId: "UCgJ7OL5RIVnTI1MlRsy61ig",
  officialSiteUrl: "https://jpffeast.jimdofree.com/",
} as const;
