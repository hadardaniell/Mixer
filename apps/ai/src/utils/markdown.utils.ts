/**
 * Trims the link scaffolding out of a scraped page before it reaches an LLM.
 *
 * Jina Reader returns the whole page, and on a content site the navigation,
 * share buttons and comment threads are overwhelmingly links. On a typical
 * Israeli recipe blog that is 73% of the returned characters — and a
 * percent-encoded Hebrew URL (`%d7%9e` per letter) is about the most expensive
 * text a tokenizer can be handed. One recipe page measured 23k tokens against
 * Groq's 12k/minute ceiling, so every long page failed over to Gemini; the same
 * page comes to 8k once the URLs are gone.
 *
 * Cheapness is only half of it. The extraction prompt asks the model to first
 * decide whether the page contains a recipe at all, and that verdict is only as
 * good as what it reads — judging a document that is three-quarters URLs is
 * guesswork. Prose in, better answer out.
 *
 * Link *text* survives; only the target is dropped. Images go entirely, because
 * Jina's alt text is generated boilerplate ("Image 52: Print Friendly, PDF &
 * Email"). Recipes are prose and pass through untouched.
 */
export function stripMarkdownNoise(markdown: string): string {
  return (
    markdown
      // Images first: the link rule below would otherwise consume the `[...](...)`
      // and leave the `!` stranded.
      .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
      // `[text](url)` → `text`. Nested image links (`[![alt](a)](b)`) have already
      // lost their inner image, so what is left here is `[](b)` and collapses away.
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      // Bare URLs Jina never wrapped — tracking pixels, `<https://…>` autolinks.
      .replace(/<?https?:\/\/[^\s<>)"']+>?/g, '')
      // Whatever is left behind is trailing spaces and runs of blank lines.
      .replace(/[ \t]+$/gm, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  );
}
