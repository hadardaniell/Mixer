import { downloadService } from '../../download.service.js';

/**
 * Extracts a cover image URL from a given source URL (YouTube, Instagram, TikTok, Facebook, or web food sites).
 */
export async function extractImageUrlFromUrl(
  url: string,
  rawText?: string,
): Promise<string | undefined> {
  // 1. YouTube shortcut
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([^&?#/]+)/i);
  if (ytMatch && ytMatch[1]) {
    return `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
  }

  // 2. Video thumbnail shortcut for TikTok / Facebook / other social videos
  if (/tiktok\.com|facebook\.com|fb\.watch/i.test(url)) {
    try {
      const info = await downloadService.getVideoInfo(url);
      if (info.thumbnail) return info.thumbnail;
    } catch {
      // ignore
    }
  }

  // 2. Extract from raw scraped markdown text (e.g. Jina Reader output)
  if (rawText) {
    const markdownImgRegex = /!\[.*?\]\((https?:\/\/[^\s\)]+?\.(?:jpg|jpeg|png|webp)(?:\?[^\s\)]*)?)\)/gi;
    const matches = [...rawText.matchAll(markdownImgRegex)];
    for (const match of matches) {
      const imgUrl = match[1];
      if (
        imgUrl &&
        !imgUrl.includes('profile_pic') &&
        !imgUrl.includes('avatar') &&
        !imgUrl.includes('logo') &&
        !imgUrl.includes('icon') &&
        !imgUrl.includes('svg')
      ) {
        return imgUrl;
      }
    }
  }

  // 3. Try fetching page HTML directly to extract og:image / twitter:image
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const html = await res.text();
      const ogMatch =
        html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
        html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i) ||
        html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i) ||
        html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);

      if (ogMatch && ogMatch[1]) {
        let imageUrl = ogMatch[1].replace(/&amp;/g, '&');
        if (imageUrl.startsWith('//')) imageUrl = 'https:' + imageUrl;
        if (imageUrl.startsWith('http')) return imageUrl;
      }
    }
  } catch {
    // Ignore fetch / timeout failures
  }

  return undefined;
}
