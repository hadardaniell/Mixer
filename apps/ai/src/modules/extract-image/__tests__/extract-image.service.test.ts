import { describe, expect, it } from 'vitest';
import { buildPrompt } from '../extract-image.service.js';

describe('buildPrompt (image extraction)', () => {
  it('instructs the model to output in Hebrew when locale is "he"', () => {
    const prompt = buildPrompt('he');
    expect(prompt).toContain('in Hebrew (עברית)');
  });

  it('instructs the model to output in English when locale is "en"', () => {
    const prompt = buildPrompt('en');
    expect(prompt).toContain('in English');
    expect(prompt).not.toContain('Hebrew (עברית)');
  });

  it('always instructs to output ALL text fields in the target language', () => {
    expect(buildPrompt('he')).toContain('Output ALL text fields');
    expect(buildPrompt('en')).toContain('Output ALL text fields');
  });

  it('always instructs to keep difficulty in English regardless of locale', () => {
    expect(buildPrompt('he')).toContain('"easy", "medium", "hard"');
    expect(buildPrompt('en')).toContain('"easy", "medium", "hard"');
  });

  it('includes the base recipe JSON structure in every prompt', () => {
    const prompt = buildPrompt('he');
    expect(prompt).toContain('"isRecipe"');
    expect(prompt).toContain('"ingredients"');
    expect(prompt).toContain('"steps"');
  });

  it('defaults to English for an unknown locale', () => {
    const prompt = buildPrompt('fr');
    expect(prompt).toContain('English');
    expect(prompt).not.toContain('Hebrew (עברית)');
  });
});
