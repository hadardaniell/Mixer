import { describe, expect, it } from 'vitest';

import { isSelfHostedImage, needsGeneratedCover } from '../recipes.service.js';

describe('needsGeneratedCover', () => {
  it('is true when the recipe has no cover at all', () => {
    expect(needsGeneratedCover(undefined)).toBe(true);
    expect(needsGeneratedCover('')).toBe(true);
  });

  it('is true for the stock photo the import preview fills in', () => {
    expect(needsGeneratedCover('https://images.pexels.com/photos/1279330/pexels-photo.jpeg')).toBe(
      true,
    );
    expect(needsGeneratedCover('https://images.unsplash.com/photo-1513104890138')).toBe(true);
  });

  it('is false for a cover the user uploaded or we already generated', () => {
    expect(
      needsGeneratedCover('https://storage.googleapis.com/mixer/recipes/abc/cover-123.png'),
    ).toBe(false);
    expect(needsGeneratedCover('https://example.com/my-own-photo.jpg')).toBe(false);
  });

  it('keeps a video thumbnail from an import', () => {
    expect(needsGeneratedCover('https://p16-sign.tiktokcdn-us.com/obj/abc~tplv.jpeg')).toBe(false);
    expect(needsGeneratedCover('https://i.ytimg.com/vi/abc/maxresdefault.jpg')).toBe(false);
  });
});

describe('isSelfHostedImage', () => {
  it('recognises our own bucket', () => {
    expect(isSelfHostedImage('https://storage.googleapis.com/mixer/recipes/a/cover-1.png')).toBe(
      true,
    );
  });

  it('treats platform CDNs as external, so they get mirrored', () => {
    expect(isSelfHostedImage('https://i.ytimg.com/vi/abc/maxresdefault.jpg')).toBe(false);
    expect(isSelfHostedImage('https://p16-sign.tiktokcdn-us.com/obj/abc~tplv.jpeg')).toBe(false);
  });
});
