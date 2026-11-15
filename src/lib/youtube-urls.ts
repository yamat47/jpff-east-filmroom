// The site copies no image and no video: everything is addressed on YouTube.

/** A 16:9 thumbnail, 320 pixels wide, for a card. */
export function thumbnailUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
}

/** A larger still for the player before it is started. */
export function posterUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

export function watchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

/** The player without YouTube's cookies until the visitor starts the video. */
export function embedUrl(videoId: string): string {
  // playsinline keeps the video in the page on a phone instead of taking the whole screen.
  return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&playsinline=1&rel=0`;
}
