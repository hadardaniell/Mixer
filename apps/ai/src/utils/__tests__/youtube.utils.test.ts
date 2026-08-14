import { describe, expect, it } from 'vitest';

import {
  isUnsupportedYouTubeUrl,
  isYouTubeShortsUrl,
  isYouTubeUrl,
} from '../youtube.utils.js';

describe('isYouTubeShortsUrl', () => {
  it('accepts a Shorts link, with or without tracking params', () => {
    expect(isYouTubeShortsUrl('https://youtube.com/shorts/IqY_4jXSAdM')).toBe(true);
    expect(isYouTubeShortsUrl('https://youtube.com/shorts/IqY_4jXSAdM?si=cFGD3o')).toBe(true);
  });

  it('accepts the www and mobile hosts', () => {
    expect(isYouTubeShortsUrl('https://www.youtube.com/shorts/abc')).toBe(true);
    expect(isYouTubeShortsUrl('https://m.youtube.com/shorts/abc')).toBe(true);
  });

  it('rejects the watch form even though it may be the same video', () => {
    expect(isYouTubeShortsUrl('https://www.youtube.com/watch?v=IqY_4jXSAdM')).toBe(false);
  });

  it('rejects the youtu.be short link, which says nothing about the format', () => {
    expect(isYouTubeShortsUrl('https://youtu.be/IqY_4jXSAdM')).toBe(false);
  });

  it('is not fooled by "shorts" appearing elsewhere in the URL', () => {
    expect(isYouTubeShortsUrl('https://www.youtube.com/watch?v=abc&list=shorts')).toBe(false);
    expect(isYouTubeShortsUrl('https://example.com/shorts/abc')).toBe(false);
  });
});

describe('isYouTubeUrl', () => {
  it('recognises both YouTube hosts', () => {
    expect(isYouTubeUrl('https://www.youtube.com/watch?v=abc')).toBe(true);
    expect(isYouTubeUrl('https://youtu.be/abc')).toBe(true);
  });

  it('does not match a host that merely contains the name', () => {
    expect(isYouTubeUrl('https://notyoutube.com/watch?v=abc')).toBe(false);
    expect(isYouTubeUrl('https://youtube.com.evil.test/watch?v=abc')).toBe(false);
  });

  it('returns false for anything unparseable', () => {
    expect(isYouTubeUrl('not a url')).toBe(false);
  });
});

describe('isUnsupportedYouTubeUrl', () => {
  it('blocks full-length YouTube links', () => {
    expect(isUnsupportedYouTubeUrl('https://www.youtube.com/watch?v=abc')).toBe(true);
    expect(isUnsupportedYouTubeUrl('https://youtu.be/abc')).toBe(true);
  });

  it('lets Shorts through', () => {
    expect(isUnsupportedYouTubeUrl('https://youtube.com/shorts/abc?si=x')).toBe(false);
  });

  it('leaves every other platform alone', () => {
    expect(isUnsupportedYouTubeUrl('https://www.instagram.com/reel/abc/')).toBe(false);
    expect(isUnsupportedYouTubeUrl('https://www.tiktok.com/@a/video/1')).toBe(false);
    expect(isUnsupportedYouTubeUrl('https://kerenagam.co.il/recipe/')).toBe(false);
  });
});
