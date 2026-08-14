/**
 * Which YouTube links this service can actually import from.
 *
 * Only Shorts are supported. A full-length YouTube video needs the video itself
 * — frames and audio — and downloading one from a datacenter address is blocked
 * by YouTube's bot check, so those imports fail after a long wait with nothing
 * to show for it. Rejecting them up front turns a slow dead end into an
 * immediate, honest answer.
 *
 * The decision is made from the URL alone, on purpose: asking YouTube how long a
 * video is means fetching its metadata, which is the very request that gets
 * blocked. A signal that is unavailable exactly when it is needed is no signal.
 *
 * The known cost: YouTube serves a Short at `/watch?v=` as well as `/shorts/`,
 * so a Short copied from a desktop address bar is refused even though it would
 * have worked. That is accepted — there is no way to tell the two apart without
 * asking YouTube.
 */
function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^(www|m)\./, '');
  } catch {
    return null;
  }
}

export function isYouTubeUrl(url: string): boolean {
  const host = hostOf(url);
  return host === 'youtube.com' || host === 'youtu.be';
}

/** True for `/shorts/<id>`, with or without query params. */
export function isYouTubeShortsUrl(url: string): boolean {
  const host = hostOf(url);
  if (host !== 'youtube.com') return false;
  try {
    return new URL(url).pathname.toLowerCase().startsWith('/shorts/');
  } catch {
    return false;
  }
}

/**
 * A YouTube link we refuse before touching the network. `youtu.be/<id>` counts:
 * the short-link form carries no hint of whether it points at a Short.
 */
export function isUnsupportedYouTubeUrl(url: string): boolean {
  return isYouTubeUrl(url) && !isYouTubeShortsUrl(url);
}
