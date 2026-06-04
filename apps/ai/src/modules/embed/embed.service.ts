import { GeminiEmbedProvider } from '../../embed-providers/gemini.embed.js';
// To switch provider: replace the line above and the line below
const embedProvider = new GeminiEmbedProvider();

export function buildRecipeText(recipe: {
  title: string;
  description?: string;
  ingredients?: Array<{ name: string }>;
  tags?: string[];
  cuisine?: string;
}): string {
  const parts = [recipe.title];
  if (recipe.description) parts.push(recipe.description);
  if (recipe.cuisine) parts.push(recipe.cuisine);
  if (recipe.tags?.length) parts.push(recipe.tags.join(', '));
  if (recipe.ingredients?.length) {
    parts.push(recipe.ingredients.map((i) => i.name).join(', '));
  }
  return parts.join('. ');
}

export async function embedRecipe(recipe: {
  title: string;
  description?: string;
  ingredients?: Array<{ name: string }>;
  tags?: string[];
  cuisine?: string;
}): Promise<number[]> {
  const text = buildRecipeText(recipe);
  return embedProvider.embed(text);
}

export async function embedQuery(query: string): Promise<number[]> {
  return embedProvider.embed(query);
}
