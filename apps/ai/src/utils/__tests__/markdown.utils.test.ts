import { describe, expect, it } from 'vitest';

import { stripMarkdownNoise } from '../markdown.utils.js';

describe('stripMarkdownNoise', () => {
  it('keeps link text and drops the target', () => {
    expect(stripMarkdownNoise('see [the recipe](https://example.com/a?b=c) now')).toBe(
      'see the recipe now',
    );
  });

  it('removes images along with their generated alt text', () => {
    expect(stripMarkdownNoise('![Image 52: Print Friendly, PDF & Email](https://x.com/b.png)')).toBe('');
  });

  it('collapses an image wrapped in a link, leaving nothing behind', () => {
    expect(stripMarkdownNoise('[![Image 5: img](https://a.com/i.svg)](https://a.com/page)')).toBe('');
  });

  it('drops bare and autolinked URLs', () => {
    expect(stripMarkdownNoise('before https://tracker.example/pixel?a=1 after')).toBe('before  after');
    expect(stripMarkdownNoise('x <https://example.com> y')).toBe('x  y');
  });

  it('leaves recipe prose untouched', () => {
    const recipe = 'מצרכים למתכון:\n\n3 ביצים גודל L\n\n1 כוס (140 גר) קמח לבן רגיל';
    expect(stripMarkdownNoise(recipe)).toBe(recipe);
  });

  it('collapses the blank lines left where markup used to be', () => {
    const input = '# Title\n\n![a](https://x/1.png)\n\n![b](https://x/2.png)\n\nReal text';
    expect(stripMarkdownNoise(input)).toBe('# Title\n\nReal text');
  });

  it('is a no-op on text that has no markup at all', () => {
    expect(stripMarkdownNoise('plain text')).toBe('plain text');
  });

  it('reduces a page that was nothing but links to their labels', () => {
    expect(stripMarkdownNoise('[a](https://x/1)\n[b](https://x/2)\n')).toBe('a\nb');
  });

  it('cuts a percent-encoded Hebrew nav menu down to its labels', () => {
    const nav = [
      '*   [דף הבית](https://kerenagam.co.il/)',
      '*   [מתכונים](https://kerenagam.co.il/%d7%9e%d7%aa%d7%9b%d7%95%d7%a0%d7%99%d7%9d/)',
    ].join('\n');
    const out = stripMarkdownNoise(nav);
    expect(out).toBe('*   דף הבית\n*   מתכונים');
    expect(out.length).toBeLessThan(nav.length / 3);
  });
});
