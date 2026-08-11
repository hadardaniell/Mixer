import { describe, expect, it } from 'vitest';
import { buildPrompt } from '../extract-text.service.js';

describe('buildPrompt (text extraction)', () => {
  it('instructs the model to output in Hebrew when locale is "he"', () => {
    const prompt = buildPrompt('he');
    expect(prompt).toContain('You MUST output the final JSON content in Hebrew (עברית)');
  });

  it('instructs the model to output in English when locale is "en"', () => {
    const prompt = buildPrompt('en');
    expect(prompt).toContain('You MUST output the final JSON content in English');
    expect(prompt).not.toContain('Hebrew (עברית)');
  });

  it('always includes the critical language instruction header', () => {
    expect(buildPrompt('he')).toContain('CRITICAL INSTRUCTION FOR LANGUAGE');
    expect(buildPrompt('en')).toContain('CRITICAL INSTRUCTION FOR LANGUAGE');
  });

  it('always instructs to keep difficulty in English regardless of locale', () => {
    const hePrompt = buildPrompt('he');
    const enPrompt = buildPrompt('en');
    expect(hePrompt).toContain('"easy", "medium", or "hard"');
    expect(enPrompt).toContain('"easy", "medium", or "hard"');
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
